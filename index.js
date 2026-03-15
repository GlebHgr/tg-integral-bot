require('dotenv').config();
const { Bot, InlineKeyboard } = require('grammy');
const { hydrate } = require('@grammyjs/hydrate');
const mongoose = require('mongoose');
const { Participant, User } = require('./models');

const bot = new Bot(process.env.BOT_TOKEN);
bot.use(hydrate());

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("🚀 База данных подключена"))
    .catch(err => console.error("Ошибка БД:", err));

// Константы текстов
const WELCOME_TEXT = "Добрый вечер, дорогие Интеграловцы!\n\nМы рады приветствовать вас на финале конкурса «Мисс и Мистер ИНТЕГРАЛ — 2026». Сегодня наш вечер посвящен теме «Трансформация. уникальная схема личности».\n\nКаждый из нас — это сложный алгоритм, набор качеств, опыта и внутренних метаморфоз. Сегодня на этой сцене мы не просто наблюдаем за талантами — мы исследуем, как меняются люди, раскрывая грани своей уникальности.\n\nЭто пространство создано для того, чтобы вы стали частью этого процесса трансформации.\n\nПрямо сейчас у вас есть возможность повлиять на ход событий: голосуйте за участников, чья «схема личности» отозвалась в вашем сердце сильнее всего, и помогите определить обладателей титулов «Мисс зрительских симпатий» и «Мистер зрительских симпатий».\n\nПрисаживайтесь поудобнее, настраивайтесь на волну открытий. Мы начинаем путь к трансформации!";

const MAIN_MENU = new InlineKeyboard()
    .text("💃 Голосовать за Мисс", "list_miss")
    .text("🕺 Голосовать за Мистера", "list_mr");

// --- Вспомогательная функция для безопасного редактирования ---
const safeEdit = async (ctx, text, keyboard) => {
    try {
        await ctx.editMessageText(text, { 
            reply_markup: keyboard, 
            parse_mode: "Markdown" 
        });
    } catch (error) {
        // Если текст или кнопки те же самые — просто ничего не делаем
        if (error.description?.includes("message is not modified")) return;
        console.error("Ошибка при редактировании:", error);
    }
};

// --- Команды ---

// Старт (всегда новое сообщение)
bot.command("start", async (ctx) => {
    await User.findOneAndUpdate(
        { userId: ctx.from.id },
        { userId: ctx.from.id },
        { upsert: true }
    );
    await ctx.reply(WELCOME_TEXT, { reply_markup: MAIN_MENU, parse_mode: "Markdown" });
});

// Список участников
bot.callbackQuery(/list_(miss|mr)/, async (ctx) => {
    const category = ctx.match[1];
    const items = await Participant.find({ category }).sort({ name: 1 });

    const keyboard = new InlineKeyboard();
    items.forEach(p => {
        keyboard.text(p.name, `vote_${category}_${p._id}`).row();
    });
    keyboard.text("⬅️ Назад в меню", "back_to_main");

    const title = category === 'miss' 
        ? "✨ **Номинантки на титул «Мисс»:**" 
        : "👔 **Номинанты на титул «Мистер»:**";
    
    await safeEdit(ctx, title, keyboard);
});

// Логика голосования
bot.callbackQuery(/vote_(miss|mr)_(.+)/, async (ctx) => {
    const [_, category, pId] = ctx.match;
    const userId = ctx.from.id;

    const user = await User.findOne({ userId });
    const hasVoted = category === 'miss' ? user.votedMiss : user.votedMr;

    if (hasVoted) {
        return ctx.answerCallbackQuery({
            text: "❌ Вы уже голосовали в этой категории!",
            show_alert: true
        });
    }

    const participant = await Participant.findByIdAndUpdate(pId, { $inc: { votes: 1 } });
    await User.findOneAndUpdate({ userId }, { 
        [category === 'miss' ? 'votedMiss' : 'votedMr']: true 
    });

    await ctx.answerCallbackQuery({ text: "✅ Ваш голос учтен!", show_alert: true });

    // После голосования возвращаем в главное меню с подтверждением
    await safeEdit(ctx, `🎉 Спасибо! Вы успешно отдали голос за: **${participant.name}**.\n\nЖелаете проголосовать во второй категории?`, MAIN_MENU);
});

// Кнопка Назад
bot.callbackQuery("back_to_main", async (ctx) => {
    await safeEdit(ctx, WELCOME_TEXT, MAIN_MENU);
});

// Команда результатов (Админ)
bot.command("results", async (ctx) => {
    if (ctx.from.id !== parseInt(process.env.ADMIN_ID)) return;

    const all = await Participant.find().sort({ category: 1, votes: -1 });
    const miss = all.filter(p => p.category === 'miss');
    const mr = all.filter(p => p.category === 'mr');

    let res = "📊 **Текущие результаты:**\n\n**МИСС:**\n";
    miss.forEach((p, i) => res += `${i + 1}. ${p.name}: ${p.votes}\n`);
    res += "\n**МИСТЕР:**\n";
    mr.forEach((p, i) => res += `${i + 1}. ${p.name}: ${p.votes}\n`);

    await ctx.reply(res, { parse_mode: "Markdown" });
});

bot.start();