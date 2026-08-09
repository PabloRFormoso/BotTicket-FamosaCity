// Para usar Firebase (GRATUITO até 10GB)
// npm install firebase-admin

const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');

// Configuração Firebase (adicionar no .env)
// FIREBASE_PROJECT_ID=seu_projeto
// FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
// FIREBASE_SERVICE_ACCOUNT_KEY=path/to/serviceAccountKey.json

/**
 * Faz upload para Firebase Storage (GRATUITO até 10GB)
 * @param {Buffer} buffer - Buffer do arquivo
 * @param {string} fileName - Nome do arquivo
 * @returns {Promise<string>} - URL pública do arquivo
 */
async function uploadToFirebase(buffer, fileName) {
    try {
        // Inicializa Firebase (fazer apenas uma vez)
        if (!admin.apps.length) {
            const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET
            });
        }

        const bucket = getStorage().bucket();
        const file = bucket.file(`transcripts/${fileName}`);

        // Upload do arquivo
        await file.save(buffer, {
            metadata: {
                contentType: 'text/html',
            },
            public: true,
        });

        // Torna o arquivo público
        await file.makePublic();

        // URL pública
        const publicUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/transcripts/${fileName}`;
        
        //console.log(`Arquivo enviado para Firebase: ${publicUrl}`);
        return publicUrl;
        
    } catch (error) {
        console.error('Erro ao fazer upload para Firebase:', error);
        throw error;
    }
}

module.exports = { uploadToFirebase };
