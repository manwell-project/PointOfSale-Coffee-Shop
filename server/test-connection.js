require('dotenv').config();
const supabase = require('./db/supabase');

async function testConnection() {
  console.log('🔄 Menguji koneksi ke Supabase...');
  try {
    const { data, error } = await supabase.from('products').select('*').limit(1);
    
    if (error) {
      console.error('❌ Gagal terhubung ke database:', error.message);
      return;
    }

    if (data) {
      console.log('✅ Berhasil terhubung ke Supabase!');
      console.log('📦 Contoh data yang diambil:', data.length > 0 ? data[0].name : 'Tidak ada produk');
    }
  } catch (err) {
    console.error('❌ Terjadi kesalahan:', err);
  }
}

testConnection();
