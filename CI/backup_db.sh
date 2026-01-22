#!/bin/bash

# =================================================================
# SCRIPT DE BACKUP AUTOMÁTICO - CASINO DAW
# =================================================================

# 1. Configuración de variables (Ajusta según tu entorno)
DB_USER="root"
DB_PASS=""
DB_NAME="casino_daw"
BACKUP_DIR="./backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="${BACKUP_DIR}/backup_${DB_NAME}_${DATE}.sql"

# 2. Crear carpeta de backups si no existe
if [ ! -d "$BACKUP_DIR" ]; then
  mkdir -p "$BACKUP_DIR"
  echo "📁 Carpeta de backups creada."
fi

# 3. Ejecución del volcado de tablas críticas
# Exportamos principalmente usuarios y logros que son la base del progreso
echo "⏳ Iniciando copia de seguridad de: ${DB_NAME}..."

mysqldump -u$DB_USER -p$DB_PASS $DB_NAME usuarios logros transacciones > $FILENAME

# 4. Verificación de éxito
if [ $? -eq 0 ]; then
  echo "✅ Backup completado con éxito: $FILENAME"
else
  echo "❌ Error al realizar el backup."
  exit 1
fi

# 5. Opcional: Limpieza de backups antiguos (más de 7 días)
find $BACKUP_DIR -type f -name "*.sql" -mtime +7 -exec rm {} \;
echo "🧹 Limpieza de archivos antiguos finalizada."