# Disaster Recovery Plan

## Database Backup
- Daily automated backups via `pg_dump`
- Retention: 30 days daily, 12 monthly
- Backup location: S3-compatible storage

## Recovery Procedures

### Database Restoration
1. Stop the application: `docker compose down api`
2. Restore from latest backup: `pg_restore -d vidyaai latest_backup.dump`
3. Verify data integrity
4. Restart the application: `docker compose up -d api`

### Queue Recovery
- Failed jobs are retained with `removeOnFail` settings
- Use admin API to retry failed jobs
- Stale jobs are automatically detected and failed by the queue watchdog
