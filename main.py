import telebot
from telebot import types

home_menu = ['Malumot olish','Online doktor','Oila','Yangiliklar']
city_list = ['Toshkent', 'Samarqand', 'Buxoro', 'Fargona', 'Andijon', 'Namangan', 'Qashqadaryo', 'Surxondaryo', 'Jizzax', 'Sirdaryo', 'Xorazm', 'Navoiy', 'Toshkent viloyati', "Qoraqalpog'iston"]

bot = telebot.TeleBot("7851101373:AAEZSNxhbJq9JuuRzs4vIwRzzb949emMWVE")
c = 0
# Per-user temp registration storage
reg_buffer = {}  # user_id -> dict(phone, gender, age)

def raqam():
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True, one_time_keyboard=True)
    kb.add(types.KeyboardButton('Telefon raqamni ulashish', request_contact=True))
    return kb

def home():
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True)
    for title in home_menu:
        kb.add(types.KeyboardButton(title))
    return kb

def jins():
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True)
    kb.add(types.KeyboardButton('Erkak'))
    kb.add(types.KeyboardButton('Ayol'))
    return kb

def inline_city_keyboard():
    kb = types.InlineKeyboardMarkup()
    for c in city_list:
        kb.add(types.InlineKeyboardButton(c, callback_data=f'city:{c}'))
    return kb
def exit():
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True)
    kb.add(types.KeyboardButton('Chiqish'))
    return kb
@bot.message_handler(commands=['start'])
def send_welcome(message):
    user_id = message.from_user.id
    reg_buffer[user_id] = {}
    rq = bot.send_message(message.chat.id, "Salom! Telefon raqamingizni yuboring.", reply_markup=raqam())
    bot.register_next_step_handler(rq, process_phone_step)

@bot.message_handler(content_types=['contact'])
def contact_handler(message):
    user_id = message.from_user.id
    if user_id in reg_buffer and 'phone' not in reg_buffer[user_id] and message.contact:
        phone = message.contact.phone_number
        if not phone.startswith('+'):
            phone = '+' + phone.lstrip(' +')
        reg_buffer[user_id]['phone'] = phone
        msg = bot.send_message(message.chat.id, "Rahmat! Endi jinsingizni tanlang.", reply_markup=jins())
        bot.register_next_step_handler(msg, process_gender_step)

def process_phone_step(message):
    user_id = message.from_user.id
    if user_id not in reg_buffer:
        reg_buffer[user_id] = {}
    if message.contact:
        phone = message.contact.phone_number
        if not phone.startswith('+'):
            phone = '+' + phone.lstrip(' +')
        reg_buffer[user_id]['phone'] = phone
        msg = bot.send_message(message.chat.id, "Rahmat! Endi jinsingizni tanlang.", reply_markup=jins())
        bot.register_next_step_handler(msg, process_gender_step)
        return
    text = (message.text or '').strip()
    if text.startswith('+') and text[1:].isdigit():
        reg_buffer[user_id]['phone'] = text
        msg = bot.send_message(message.chat.id, "Rahmat! Endi jinsingizni tanlang.", reply_markup=jins())
        bot.register_next_step_handler(msg, process_gender_step)
    else:
        rq = bot.send_message(message.chat.id, "Format xato. +998901234567 ko'rinishida. Qayta yuboring.", reply_markup=raqam())
        bot.register_next_step_handler(rq, process_phone_step)


def process_gender_step(message):
    user_id = message.from_user.id
    if message.text in ['Erkak','Ayol']:
        reg_buffer[user_id]['gender'] = message.text
        msg = bot.send_message(message.chat.id, "Rahmat! Yoshingizni kiriting:", reply_markup=types.ReplyKeyboardRemove())
        bot.register_next_step_handler(msg, process_age_step)
    else:
        msg = bot.send_message(message.chat.id, "Iltimos jinsni tugmadan tanlang.", reply_markup=jins())
        bot.register_next_step_handler(msg, process_gender_step)


def process_age_step(message):
    user_id = message.from_user.id
    txt = (message.text or '').strip()
    if txt.isdigit() and 0 < int(txt) < 120:
        reg_buffer[user_id]['age'] = int(txt)
        bot.send_message(message.chat.id, "Rahmat! Yashash manzilingizni tanlang:", reply_markup=inline_city_keyboard())
    else:
        msg = bot.send_message(message.chat.id, "Yosh noto'g'ri. Qayta kiriting:")
        bot.register_next_step_handler(msg, process_age_step)

@bot.callback_query_handler(func=lambda call: call.data.startswith('city:'))
def callback_city(call):
    user_id = call.from_user.id
    if user_id not in reg_buffer:
        bot.answer_callback_query(call.id, 'Sessiya topilmadi')
        return
    cty = call.data.split(':',1)[1]
    if cty not in city_list:
        bot.answer_callback_query(call.id, 'Noto\'g\'ri tanlov')
        return
    reg_buffer[user_id]['city'] = cty
    from database import insert_user
    insert_user(user_id, reg_buffer[user_id].get('gender'), reg_buffer[user_id].get('age'), cty, reg_buffer[user_id].get('phone'))
    bot.answer_callback_query(call.id, 'Saqlandi')
    bot.send_message(call.message.chat.id, "Registratsiya tugadi!", reply_markup=home())
    # Clear buffer
    reg_buffer.pop(user_id, None)

@bot.message_handler(content_types=['text'])
def handle_home_menu(message):
    global c
    if c == 0:
        if message.text == 'Malumot olish':
            bot.send_message(message.chat.id, "Bu yerda malumot olishingiz mumkin.")
        elif message.text == 'Online doktor':
            c = 1
            bot.send_message(message.chat.id, "Online doktor bilan bog'landingiz.")
        elif message.text == 'Oila':
            bot.send_message(message.chat.id, "Oila bo'limiga xush kelibsiz.")
        elif message.text == 'Yangiliklar':
            bot.send_message(message.chat.id, "So'nggi yangiliklar bilan tanishing.")
    elif message.text == 'Chiqish':
        bot.send_message(message.chat.id, "Asosiy menyuga qaytildi.", reply_markup=home())
        c = 0
    else:
        from model import models
        response = models(message.text)
        bot.send_message(message.chat.id, response,reply_markup=exit())


bot.polling()
