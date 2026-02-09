import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCategories() {
    const { data, error } = await supabase
        .from('educational_content')
        .select('category');

    if (error) {
        console.error('Error fetching categories:', error);
        return;
    }

    const categories = [...new Set(data.map(item => item.category))];
    console.log('Unique categories in database:', categories);
}

checkCategories();
