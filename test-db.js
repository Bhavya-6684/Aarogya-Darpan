const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')

// Read .env.local manually — no dotenv needed
const envPath = path.join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const uriLine = envContent.split('\n').find(l => l.startsWith('MONGODB_URI='))
const uri = uriLine ? uriLine.replace('MONGODB_URI=', '').trim() : ''

if (!uri) {
  console.error('❌ MONGODB_URI not found in .env.local')
  process.exit(1)
}

console.log('🔍 Testing MongoDB Atlas connection...')
console.log('🔗 URI:', uri.substring(0, 40) + '...')
console.log('')

mongoose.connect(uri, { serverSelectionTimeoutMS: 30000 })
  .then(() => {
    console.log('✅ SUCCESS! MongoDB Atlas connected!')
    console.log('📊 Database:', mongoose.connection.db.databaseName)
    console.log('')
    console.log('🚀 Run: npm run dev')
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ FAILED:', err.message)
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 TO FIX in MongoDB Atlas:')
    console.log('1. Go to https://cloud.mongodb.com')
    console.log('2. Security → Network Access')
    console.log('3. + ADD IP ADDRESS')
    console.log('4. Click "ALLOW ACCESS FROM ANYWHERE" (0.0.0.0/0)')
    console.log('5. Confirm → wait 60 seconds')
    console.log('6. Run: node test-db.js')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    process.exit(1)
  })
