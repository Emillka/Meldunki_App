#!/bin/bash

# Skrypt do backupu bazy danych i przywracania
# Obsługuje backup do S3 i lokalne przywracanie

set -e

# Kolory dla output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funkcja do logowania
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Sprawdzenie argumentów
if [ $# -lt 1 ]; then
    echo "Usage: $0 <backup|restore> [options]"
    echo ""
    echo "Backup:"
    echo "  $0 backup [--s3] [--local]"
    echo ""
    echo "Restore:"
    echo "  $0 restore <backup-file> [--s3]"
    echo ""
    echo "Examples:"
    echo "  $0 backup --s3"
    echo "  $0 backup --local"
    echo "  $0 restore backup_2024-01-15.sql --s3"
    exit 1
fi

ACTION=$1
shift

# Sprawdzenie czy plik .env.production istnieje
if [ ! -f ".env.production" ]; then
    error ".env.production file not found"
fi

# Załadowanie zmiennych środowiskowych
source .env.production

# Funkcja backupu
backup() {
    local use_s3=false
    local use_local=false
    
    # Parsowanie argumentów
    while [[ $# -gt 0 ]]; do
        case $1 in
            --s3)
                use_s3=true
                shift
                ;;
            --local)
                use_local=true
                shift
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
    
    # Jeśli nie podano żadnej opcji, użyj lokalnego backupu
    if [ "$use_s3" = false ] && [ "$use_local" = false ]; then
        use_local=true
    fi
    
    local timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
    local backup_filename="meldunki_backup_${timestamp}.sql"
    
    log "🗄️ Starting database backup..."
    
    # Tworzenie backupu
    log "📦 Creating database dump..."
    docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --clean \
        --if-exists \
        --create \
        > "$backup_filename"
    
    if [ $? -eq 0 ]; then
        log "✅ Database backup created: $backup_filename"
    else
        error "Database backup failed"
    fi
    
    # Kompresja backupu
    log "🗜️ Compressing backup..."
    gzip "$backup_filename"
    backup_filename="${backup_filename}.gz"
    
    # Upload do S3
    if [ "$use_s3" = true ]; then
        if [ -z "$AWS_S3_BUCKET" ] || [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
            error "AWS S3 configuration missing in .env.production"
        fi
        
        log "☁️ Uploading backup to S3..."
        aws s3 cp "$backup_filename" "s3://$AWS_S3_BUCKET/backups/$backup_filename"
        
        if [ $? -eq 0 ]; then
            log "✅ Backup uploaded to S3: s3://$AWS_S3_BUCKET/backups/$backup_filename"
        else
            error "S3 upload failed"
        fi
    fi
    
    # Lokalne przechowywanie
    if [ "$use_local" = true ]; then
        local backup_dir="./backups"
        mkdir -p "$backup_dir"
        mv "$backup_filename" "$backup_dir/"
        log "✅ Backup stored locally: $backup_dir/$backup_filename"
    fi
    
    log "🎉 Backup completed successfully!"
}

# Funkcja przywracania
restore() {
    if [ $# -lt 1 ]; then
        error "Backup file required for restore"
    fi
    
    local backup_file=$1
    local use_s3=false
    shift
    
    # Parsowanie argumentów
    while [[ $# -gt 0 ]]; do
        case $1 in
            --s3)
                use_s3=true
                shift
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
    
    log "🔄 Starting database restore..."
    
    # Pobieranie backupu z S3
    if [ "$use_s3" = true ]; then
        if [ -z "$AWS_S3_BUCKET" ] || [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
            error "AWS S3 configuration missing in .env.production"
        fi
        
        log "☁️ Downloading backup from S3..."
        aws s3 cp "s3://$AWS_S3_BUCKET/backups/$backup_file" "./$backup_file"
        
        if [ $? -ne 0 ]; then
            error "S3 download failed"
        fi
    fi
    
    # Sprawdzenie czy plik backupu istnieje
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    # Potwierdzenie przed przywróceniem
    warn "⚠️ This will completely replace the current database!"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log "Restore cancelled"
        exit 0
    fi
    
    # Tworzenie backupu przed przywróceniem
    log "🛡️ Creating safety backup before restore..."
    local safety_backup="safety_backup_$(date +"%Y-%m-%d_%H-%M-%S").sql"
    docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --clean \
        --if-exists \
        --create \
        > "$safety_backup"
    
    # Przywracanie bazy danych
    log "🔄 Restoring database..."
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U "$POSTGRES_USER"
    else
        docker-compose -f docker-compose.prod.yml exec -T postgres psql -U "$POSTGRES_USER" < "$backup_file"
    fi
    
    if [ $? -eq 0 ]; then
        log "✅ Database restored successfully!"
        log "🛡️ Safety backup created: $safety_backup"
    else
        error "Database restore failed"
    fi
    
    # Czyszczenie tymczasowych plików
    if [ "$use_s3" = true ]; then
        rm -f "$backup_file"
    fi
}

# Główna logika
case $ACTION in
    backup)
        backup "$@"
        ;;
    restore)
        restore "$@"
        ;;
    *)
        error "Unknown action: $ACTION"
        ;;
esac
