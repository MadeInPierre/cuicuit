# Declarative Schema for Supabase

Quick start [video tutorial](https://www.youtube.com/watch?v=EALkUlOKvAs)

## Initial setup 

1. **Initial setup only:** If you have an existing database, use this command to dump the existing schema in a schema file. Feel free to organize it into multiple files as needed:
```bash
supabase db dump > supabase/schemas/prod.sql  # Only when prod has more up-to-date schema
```

P.S. I'm using the [SQL Formatter](https://marketplace.visualstudio.com/items?itemName=ReneSaarsoo.sql-formatter-vsc) extension for VSCode to format SQL files on save. 
- Set the dialect to `postgresql` in settings
- Set it as the default formatter for SQL files: Ctrl+P → Format document with... → Configure default formatter → SQL Formatter

## Happy Path: Updating the schema

2. Make any changes to the schema, and run the following command to generate a new migration that can be used to update the database:
```bash
supabase db diff -f <name_of_your_migration>
```

This will create a new migration file in the `supabase/migrations` folder. Go into it and make sure everything looks good.

3. To apply the migration to your local database, run:
```bash
supabase migrations up
```

4. Update your app's TypeScript definitions to reflect the new schema:
```bash
npm run db:types:local
```

5. To apply the migration to your online production database, run:
```bash
supabase db push
```
