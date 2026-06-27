CREATE POLICY "tmp all 108m1fm_0" ON storage.objects FOR
SELECT
    TO public USING (true);

CREATE POLICY "tmp all 108m1fm_1" ON storage.objects FOR INSERT TO public
WITH
    CHECK (true);