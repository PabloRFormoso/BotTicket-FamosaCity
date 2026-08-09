// Sistema simplificado usando apenas GitHub Pages (100% GRATUITO)
require('dotenv').config();
const { uploadToGitHub } = require('./githubUpload');
const { shortenUrl } = require('./urlShortener');

/**
 * Faz upload da transcrição para GitHub Pages
 * @param {Buffer} buffer - Buffer do arquivo HTML
 * @param {string} fileName - Nome do arquivo
 * @returns {Promise<string>} - URL pública (possivelmente encurtada)
 */
async function uploadTranscript(buffer, fileName) {
    try {
        //console.log('📤 Enviando transcrição para GitHub Pages...');
        const longUrl = await uploadToGitHub(buffer, fileName);
        
        // Encurtar URL se habilitado
        if (process.env.SHORTEN_URLS === 'true') {
            //console.log('🔗 Encurtando URL...');
            const shortUrl = await shortenUrl(longUrl);
            //console.log(`📏 URL original: ${longUrl.length} chars`);
            //console.log(`📏 URL encurtada: ${shortUrl.length} chars`);
            //console.log(`📊 Economia: ${longUrl.length - shortUrl.length} caracteres`);
            return shortUrl;
        }
        
        return longUrl;
    } catch (error) {
        console.error('❌ Erro no upload para GitHub:', error.message);
        throw error;
    }
}

/**
 * Valida se as configurações do GitHub estão corretas
 */
function validateGitHubConfig() {
    const requiredEnvs = ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'];
    const missing = requiredEnvs.filter(env => !process.env[env]);
    
    if (missing.length > 0) {
        throw new Error(`❌ Configurações do GitHub faltando no .env: ${missing.join(', ')}`);
    }
    
    //console.log('✅ Configuração do GitHub validada');
    //console.log(`📂 Repositório: ${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`);
    //console.log(`🌐 URLs serão: https://${process.env.GITHUB_OWNER}.github.io/${process.env.GITHUB_REPO}/transcripts/`);
}

/**
 * Inicializa o serviço de upload do GitHub
 */
function initializeUploadService() {
    //console.log('🚀 Inicializando GitHub Pages para transcrições...');
    
    try {
        validateGitHubConfig();
        //console.log('💰 Custo: 100% GRATUITO (GitHub Pages)');
        //console.log('📦 Limite: 1GB de espaço (suficiente para milhares de tickets)');
    } catch (error) {
        console.error(error.message);
        //console.log('\n📋 Configure no .env:');
        //console.log('GITHUB_TOKEN=seu_personal_access_token');
        //console.log('GITHUB_OWNER=seu_usuario');
        //console.log('GITHUB_REPO=nome_do_repositorio');
        throw error;
    }
}

module.exports = {
    uploadTranscript,
    initializeUploadService,
    validateGitHubConfig
};
