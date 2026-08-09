require('dotenv').config();
const { Octokit } = require('@octokit/rest');

/**
 * Faz upload de transcrição para GitHub Pages (100% GRATUITO)
 * @param {Buffer} buffer - Buffer do arquivo HTML
 * @param {string} fileName - Nome do arquivo
 * @returns {Promise<string>} - URL pública do arquivo
 */
async function uploadToGitHub(buffer, fileName) {
    try {
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN,
        });

        // Converte buffer para base64
        const content = buffer.toString('base64');
        
        // Caminho no repositório
        const filePath = `transcripts/${fileName}`;
        
        //console.log(`📤 Enviando ${fileName} para GitHub Pages...`);
        
        // Faz upload do arquivo
        await octokit.rest.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: filePath,
            message: `📋 Add transcript: ${fileName}`,
            content: content,
            branch: process.env.GITHUB_BRANCH || 'live', // Padrão para 'live' se não definido
        });

        // URL pública do GitHub Pages
        const publicUrl = `https://${process.env.GITHUB_OWNER}.github.io/${process.env.GITHUB_REPO}/${filePath}`;
        
        //console.log(`✅ Arquivo enviado com sucesso!`);
        //console.log(`🔗 URL: ${publicUrl}`);
        return publicUrl;
        
    } catch (error) {
        console.error('❌ Erro ao fazer upload para GitHub:', error.message);
        
        // Mensagens de erro mais específicas
        if (error.status === 401) {
            throw new Error('Token do GitHub inválido. Verifique GITHUB_TOKEN no .env');
        } else if (error.status === 404) {
            throw new Error(`Repositório ${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO} não encontrado`);
        } else if (error.status === 403) {
            throw new Error('Sem permissão para escrever no repositório. Verifique as permissões do token');
        }
        
        throw error;
    }
}

module.exports = { uploadToGitHub };
