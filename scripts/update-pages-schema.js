// Script to update the Supabase database schema
// This script adds a fb_page_id column to the pages table
// and migrates existing data to use the new schema

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePagesSchema() {
  console.log('Starting database schema update...');

  try {
    // 1. Check if fb_page_id column already exists
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_columns_info', { table_name: 'pages' });

    if (columnsError) {
      console.error('Error checking columns:', columnsError);
      return;
    }

    const fbPageIdExists = columns.some(col => col.column_name === 'fb_page_id');

    if (fbPageIdExists) {
      console.log('fb_page_id column already exists, skipping creation');
    } else {
      // 2. Add fb_page_id column
      console.log('Adding fb_page_id column to pages table...');
      
      // Using raw SQL query through RPC
      const { error: addColumnError } = await supabase
        .rpc('run_sql', { 
          query: 'ALTER TABLE pages ADD COLUMN fb_page_id TEXT' 
        });

      if (addColumnError) {
        console.error('Error adding fb_page_id column:', addColumnError);
        return;
      }
      
      console.log('fb_page_id column added successfully');
    }

    // 3. Migrate existing data - copy id to fb_page_id for existing records
    console.log('Migrating existing data...');
    
    // Get all pages
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('*');
    
    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
      return;
    }
    
    // Update each page to set fb_page_id = id if fb_page_id is null
    for (const page of pages) {
      if (!page.fb_page_id) {
        const { error: updateError } = await supabase
          .from('pages')
          .update({ fb_page_id: page.id })
          .eq('id', page.id);
        
        if (updateError) {
          console.error(`Error updating page ${page.id}:`, updateError);
        }
      }
    }
    
    console.log('Data migration completed');
    
    // 4. Add NOT NULL constraint to fb_page_id
    console.log('Adding NOT NULL constraint to fb_page_id...');
    
    const { error: notNullError } = await supabase
      .rpc('run_sql', { 
        query: 'ALTER TABLE pages ALTER COLUMN fb_page_id SET NOT NULL' 
      });
    
    if (notNullError) {
      console.error('Error adding NOT NULL constraint:', notNullError);
      return;
    }
    
    console.log('NOT NULL constraint added successfully');
    
    // 5. Create index on fb_page_id and account_id
    console.log('Creating index on fb_page_id and account_id...');
    
    const { error: indexError } = await supabase
      .rpc('run_sql', { 
        query: 'CREATE INDEX IF NOT EXISTS idx_pages_fb_page_id_account_id ON pages (fb_page_id, account_id)' 
      });
    
    if (indexError) {
      console.error('Error creating index:', indexError);
      return;
    }
    
    console.log('Index created successfully');
    
    console.log('Database schema update completed successfully');
  } catch (error) {
    console.error('Unexpected error during schema update:', error);
  }
}

// Run the update function
updatePagesSchema().catch(console.error); 