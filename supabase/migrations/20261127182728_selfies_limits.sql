-- Βήμα 5 (συμπλήρωμα): ο κάδος δέχεται μόνο JPEG έως 5 MB.
-- Το ίδιο το Storage το ελέγχει πριν γράψει το αρχείο, ό,τι κι αν στείλει η εφαρμογή.
update storage.buckets
set file_size_limit = 5242880,            -- 5 MB = 5 × 1024 × 1024
    allowed_mime_types = array['image/jpeg']
where id = 'selfies';