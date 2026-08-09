require('dotenv').config();
const axios = require('axios');

/**
 * Encurta uma URL usando diferentes serviços gratuitos
 * @param {string} longUrl - URL longa para encurtar
 * @returns {Promise<string>} - URL encurtada
 */
async function shortenUrl(longUrl) {
    const service = process.env.URL_SHORTENER || 'tinyurl'; // Padrão: TinyURL
    
    try {
        switch (service.toLowerCase()) {
            case 'tinyurl':
                return await shortenWithTinyUrl(longUrl);
            case 'isgd':
                return await shortenWithIsGd(longUrl);
            case 'vgd':
                return await shortenWithVgd(longUrl);
            default:
                //console.log('⚠️ Serviço de encurtamento não configurado, usando URL original');
                return longUrl;
        }
    } catch (error) {
        console.error('❌ Erro ao encurtar URL:', error.message);
        //console.log('🔄 Usando URL original como fallback');
        return longUrl;
    }
}

/**
 * Encurta URL usando TinyURL (100% gratuito, sem limite)
 */
async function shortenWithTinyUrl(longUrl) {
    try {
        const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
        
        if (response.data && typeof response.data === 'string' && response.data.startsWith('http')) {
            //console.log('✅ URL encurtada com TinyURL');
            return response.data.trim();
        }
        
        throw new Error('Resposta inválida do TinyURL');
    } catch (error) {
        throw new Error(`TinyURL falhou: ${error.message}`);
    }
}

/**
 * Encurta URL usando is.gd (100% gratuito, sem registro)
 */
async function shortenWithIsGd(longUrl) {
    try {
        const response = await axios.post('https://is.gd/create.php', null, {
            params: {
                format: 'simple',
                url: longUrl
            }
        });
        
        if (response.data && response.data.startsWith('https://is.gd/')) {
            //console.log('✅ URL encurtada com is.gd');
            return response.data;
        }
        
        throw new Error('Resposta inválida do is.gd');
    } catch (error) {
        throw new Error(`is.gd falhou: ${error.message}`);
    }
}

/**
 * Encurta URL usando v.gd (100% gratuito, sem registro)
 */
async function shortenWithVgd(longUrl) {
    try {
        const response = await axios.post('https://v.gd/create.php', null, {
            params: {
                format: 'simple',
                url: longUrl
            }
        });
        
        if (response.data && response.data.startsWith('https://v.gd/')) {
            //console.log('✅ URL encurtada com v.gd');
            return response.data;
        }
        
        throw new Error('Resposta inválida do v.gd');
    } catch (error) {
        throw new Error(`v.gd falhou: ${error.message}`);
    }
}

/**
 * Testa todos os serviços de encurtamento
 */
async function testUrlShorteners() {
    const testUrl = 'https://PabloRFormoso.github.io/bot-transcripts/transcripts/teste-longo-nome-arquivo-123456789.html';
    
    //console.log('🧪 Testando serviços de encurtamento...\n');
    //console.log(`📏 URL original (${testUrl.length} chars):`);
    //console.log(testUrl);
    //console.log('');
    
    const services = ['tinyurl', 'isgd', 'vgd'];
    
    for (const service of services) {
        try {
            //console.log(`🔗 Testando ${service.toUpperCase()}...`);
            process.env.URL_SHORTENER = service;
            
            const shortUrl = await shortenUrl(testUrl);
            //console.log(`✅ Resultado (${shortUrl.length} chars): ${shortUrl}`);
            //console.log(`📊 Economia: ${testUrl.length - shortUrl.length} caracteres\n`);
            
        } catch (error) {
            //console.log(`❌ ${service} falhou: ${error.message}\n`);
        }
    }
}

module.exports = {
    shortenUrl,
    testUrlShorteners
};
