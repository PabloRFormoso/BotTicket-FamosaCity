require('dotenv').config();

const { uploadToXampp, validateXamppConfig } = require('./xamppUpload');

async function uploadTranscript(buffer, fileName) {
    return uploadToXampp(buffer, fileName);
}

function initializeUploadService() {
    validateXamppConfig();
    console.log(`✅ Transcripts: XAMPP/CDN -> ${process.env.TRANSCRIPT_BASE_URL}`);
}

module.exports = {
    uploadTranscript,
    initializeUploadService
};
