const { Telegraf } = require('telegraf');

// Переменные из окружения Vercel
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID || '@n_but_test';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://segazbs-app.vercel.app';

if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN не настроен в Vercel!');
}

const bot = new Telegraf(BOT_TOKEN);

// ============================================
// ФОРМИРОВАНИЕ ПОСТА
// ============================================
function buildPost(type, data, action = 'добавлен') {
    const emojis = {
        addon: '🧩',
        config: '⚙️',
        macro: '📝'
    };
    
    const titles = {
        addon: 'Аддон',
        config: 'Конфиг',
        macro: 'Макрос'
    };
    
    const emoji = emojis[type] || '📦';
    const title = titles[type] || 'Элемент';
    
    let post = `📌 *Новый ${title}!*\n\n`;
    post += `${emoji} *${data.name}*\n`;
    
    if (data.description) {
        post += `📖 ${data.description}\n`;
    }
    
    if (data.class) {
        const classNames = {
            warrior: 'Воин',
            paladin: 'Паладин',
            deathknight: 'Рыцарь смерти',
            mage: 'Маг',
            priest: 'Жрец',
            rogue: 'Разбойник',
            shaman: 'Шаман',
            hunter: 'Охотник',
            warlock: 'Чернокнижник',
            druid: 'Друид',
            universal: 'Универсальный'
        };
        post += `🎯 Класс: ${classNames[data.class] || data.class}\n`;
    }
    
    if (data.addonName) {
        post += `🔧 Аддон: ${data.addonName}\n`;
    }
    
    if (data.version) {
        post += `📌 Версия: ${data.version}\n`;
    }
    
    post += `\n🔗 Открыть базу знаний:\n${WEBAPP_URL}`;
    
    return post;
}

// ============================================
// ОТПРАВКА ПОСТА В КАНАЛ
// ============================================
async function sendPost(type, data, action = 'добавлен') {
    if (!BOT_TOKEN) {
        console.error('❌ BOT_TOKEN не настроен');
        return { success: false, error: 'BOT_TOKEN не настроен' };
    }
    
    try {
        const postText = buildPost(type, data, action);
        
        const sent = await bot.telegram.sendMessage(
            CHANNEL_ID,
            postText,
            {
                parse_mode: 'Markdown',
                disable_web_page_preview: false
            }
        );
        
        console.log(`✅ Пост отправлен в канал: ${sent.message_id}`);
        return { success: true, message_id: sent.message_id };
    } catch (error) {
        console.error('❌ Ошибка отправки:', error);
        return { success: false, error: error.description || error.message };
    }
}

// ============================================
// API-ЭНДПОИНТЫ ДЛЯ VERCEL
// ============================================
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    
    // Отправка поста о новом элементе
    if (path === '/api/sendPost' && req.method === 'POST') {
        try {
            const { type, data } = req.body || {};
            if (!type || !data) {
                return res.status(400).json({ success: false, error: 'Не указан тип или данные' });
            }
            
            const result = await sendPost(type, data);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
    
    // Отправка произвольного сообщения
    if (path === '/api/sendMessage' && req.method === 'POST') {
        try {
            const { text } = req.body || {};
            if (!text) {
                return res.status(400).json({ success: false, error: 'Не указан текст' });
            }
            
            const sent = await bot.telegram.sendMessage(CHANNEL_ID, text, {
                parse_mode: 'Markdown',
                disable_web_page_preview: false
            });
            
            return res.status(200).json({ success: true, message_id: sent.message_id });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
    
    // Открепить все сообщения
    if (path === '/api/unpinAll' && req.method === 'POST') {
        try {
            await bot.telegram.unpinAllChatMessages(CHANNEL_ID);
            return res.status(200).json({ success: true, message: 'Все сообщения откреплены' });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
    
    // Проверка статуса
    if (path === '/api/health') {
        return res.status(200).json({
            status: 'ok',
            bot: 'SegaZBS Helper',
            env: {
                hasToken: !!BOT_TOKEN,
                channelId: CHANNEL_ID,
                webappUrl: WEBAPP_URL
            }
        });
    }
    
    res.status(404).json({ error: 'Not found' });
};
