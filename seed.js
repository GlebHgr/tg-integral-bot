require('dotenv').config();
const mongoose = require('mongoose');
const { Participant } = require('./models');

const participants = [
    { name: "Участница №1 Помазкова Анна", category: "miss" },
    { name: "Участница №2 Бучинская Дарья", category: "miss" },
    { name: "Участница №3 Матусевич Лиана", category: "miss" },
    { name: "Участница №4 Мирошевская Анастасия", category: "miss" },
    { name: "Участница №5 Амельянович Гражина", category: "miss" },
    { name: "Участница №6 Николайкова Анастасия", category: "miss" },
    { name: "Участник №1 Дорошкевич Матвей", category: "mr" },
    { name: "Участник №2 Бойчук Вадим", category: "mr" },
    { name: "Участник №3 Тюшкевич Кирилл", category: "mr" },
    { name: "Участник №4 Дубовский Алексей", category: "mr" },
    { name: "Участник №5 Каковка Максим", category: "mr" },
    { name: "Участник №6 Ошмянский Павел", category: "mr" }
];

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    await Participant.deleteMany({}); // Очистка перед заполнением
    await Participant.insertMany(participants);
    console.log("✅ Участники успешно загружены в базу!");
    process.exit();
}
run();