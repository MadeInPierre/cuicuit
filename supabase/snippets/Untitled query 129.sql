select billing.consume_credits('eeade402-2584-4daa-80f1-3d48dd07d6c3', 5, 'test_consume', '{"comment": "Hello World"}');

INSERT INTO "public"."credit_logs" ("id", "user_id", "credit_type", "amount", "source", "stripe_charge_id", "metadata", "created_at") VALUES ('3a700119-91ef-4277-ae99-3cb8a4bc8251', null, 'public', 60, 'stripe_charge', 'fake_id', '{"currency": "eur", "sponsored_by": "cc5f4f5b-02d5-467e-8f05-103c98b200b1", "stripe_amount": 6000 }', '2026-07-18 15:51:10.828632+00');

INSERT INTO "public"."credit_balances" ("id", "user_id", "balance") VALUES ('00000000-0000-0000-0000-000000000000', null, 0) ON conflict do nothing;