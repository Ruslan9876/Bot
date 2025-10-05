/**
 * Анализатор показателей здоровья
 * Проверяет значения на соответствие нормам и генерирует рекомендации
 */

/**
 * Анализ уровня глюкозы
 * @param {number} value - Значение глюкозы в ммоль/л
 * @param {string} mealType - Тип измерения (натощак, после еды и т.д.)
 * @returns {Object} - {status, message, recommendations}
 */
function analyzeGlucose(value, mealType = 'натощак') {
    const result = {
        status: 'normal',
        message: '',
        recommendations: []
    };

    // Критически низкий уровень
    if (value < 3.5) {
        result.status = 'critical';
        result.message = `🚨 ОПАСНО! Уровень глюкозы критически низкий: ${value} ммоль/л`;
        result.recommendations = [
            '❗ СРОЧНО примите 15-20 г быстрых углеводов:',
            '• 3-4 кусочка сахара',
            '• 150 мл сладкого сока',
            '• 1 столовая ложка мёда',
            '⏰ Повторите измерение через 15 минут',
            '☎️ Если не улучшается - вызовите скорую помощь (103, 112)'
        ];
        return result;
    }

    // Критически высокий уровень
    if (value > 13.0) {
        result.status = 'critical';
        result.message = `🚨 ОПАСНО! Уровень глюкозы критически высокий: ${value} ммоль/л`;
        result.recommendations = [
            '❗ Немедленно свяжитесь с врачом!',
            '💊 Проверьте время последнего приёма лекарств',
            '💧 Пейте больше воды',
            '🚫 НЕ занимайтесь физической активностью',
            '📱 Приготовьтесь сообщить врачу:',
            '  - когда последний раз принимали инсулин/лекарства',
            '  - что ели сегодня',
            '  - есть ли тошнота, слабость, жажда'
        ];
        return result;
    }

    // Анализ в зависимости от типа измерения
    if (mealType === 'натощак' || mealType === 'перед едой') {
        if (value < 4.0) {
            result.status = 'warning';
            result.message = `⚠️ Уровень глюкозы немного низкий: ${value} ммоль/л (норма натощак: 4.0-7.0)`;
            result.recommendations = [
                '🍞 Съешьте что-то с углеводами перед следующим приёмом пищи',
                '📊 Проверьте уровень через 30 минут',
                '💊 Возможно, нужна корректировка дозы лекарств - обсудите с врачом'
            ];
        } else if (value > 7.0) {
            result.status = 'warning';
            result.message = `⚠️ Уровень глюкозы повышен: ${value} ммоль/л (норма натощак: 4.0-7.0)`;
            result.recommendations = [
                '🚶 Рассмотрите лёгкую физическую активность (прогулка 15-20 мин)',
                '💧 Выпейте стакан воды',
                '📊 Проследите за питанием сегодня',
                '💊 Проверьте, не пропустили ли приём лекарств'
            ];
        } else {
            result.status = 'normal';
            result.message = `✅ Отлично! Уровень глюкозы в норме: ${value} ммоль/л`;
            result.recommendations = [
                '👍 Продолжайте в том же духе!',
                '📊 Соблюдайте режим питания и приёма лекарств'
            ];
        }
    } else if (mealType === 'после еды') {
        if (value < 4.0) {
            result.status = 'warning';
            result.message = `⚠️ Уровень глюкозы низкий после еды: ${value} ммоль/л`;
            result.recommendations = [
                '🍬 Примите 10-15 г быстрых углеводов',
                '💊 Возможно, доза инсулина слишком высокая - обсудите с врачом',
                '📊 Проверьте уровень через 15 минут'
            ];
        } else if (value > 10.0) {
            result.status = 'warning';
            result.message = `⚠️ Уровень глюкозы повышен после еды: ${value} ммоль/л (норма: до 8-10)`;
            result.recommendations = [
                '📝 Проанализируйте, что ели (возможно, много углеводов)',
                '🚶 Лёгкая прогулка поможет снизить уровень',
                '💊 Возможно, нужна корректировка дозы - обсудите с врачом'
            ];
        } else {
            result.status = 'normal';
            result.message = `✅ Хорошо! Уровень глюкозы после еды в норме: ${value} ммоль/л`;
            result.recommendations = [
                '👍 Отличный контроль!',
                '📊 Так держать!'
            ];
        }
    } else {
        // Общий анализ для других типов
        if (value >= 4.0 && value <= 10.0) {
            result.status = 'normal';
            result.message = `✅ Уровень глюкозы в приемлемых пределах: ${value} ммоль/л`;
        } else {
            result.status = 'warning';
            result.message = `⚠️ Уровень глюкозы требует внимания: ${value} ммоль/л`;
            result.recommendations = [
                '📊 Проследите за динамикой',
                '💊 Соблюдайте режим приёма лекарств'
            ];
        }
    }

    return result;
}

/**
 * Анализ артериального давления
 * @param {number} systolic - Систолическое (верхнее) давление
 * @param {number} diastolic - Диастолическое (нижнее) давление
 * @returns {Object} - {status, message, recommendations}
 */
function analyzeBloodPressure(systolic, diastolic) {
    const result = {
        status: 'normal',
        message: '',
        recommendations: []
    };

    // Критически высокое давление (гипертонический криз)
    if (systolic >= 180 || diastolic >= 120) {
        result.status = 'critical';
        result.message = `🚨 ОПАСНО! Критически высокое давление: ${systolic}/${diastolic} мм рт. ст.`;
        result.recommendations = [
            '❗ СРОЧНО обратитесь за медицинской помощью!',
            '☎️ Вызовите скорую помощь (103, 112)',
            '💊 Примите назначенный врачом препарат для снижения давления',
            '🛋️ Лягте, приподняв голову',
            '😮‍💨 Постарайтесь дышать глубоко и спокойно',
            '🚫 НЕ принимайте двойную дозу лекарств!'
        ];
        return result;
    }

    // Критически низкое давление
    if (systolic < 90 || diastolic < 60) {
        result.status = 'critical';
        result.message = `🚨 ВНИМАНИЕ! Критически низкое давление: ${systolic}/${diastolic} мм рт. ст.`;
        result.recommendations = [
            '🛋️ Лягте и приподнимите ноги выше уровня сердца',
            '💧 Выпейте воды',
            '🧂 Можно съесть что-то солёное',
            '☎️ Если появилась слабость, головокружение - вызовите скорую',
            '📱 Свяжитесь с врачом для корректировки лечения'
        ];
        return result;
    }

    // Повышенное давление (гипертония 1-2 степени)
    if (systolic >= 140 || diastolic >= 90) {
        result.status = 'warning';
        result.message = `⚠️ Повышенное давление: ${systolic}/${diastolic} мм рт. ст. (норма: 100/70 - 140/90)`;
        result.recommendations = [
            '💊 Проверьте, принимали ли лекарства сегодня',
            '🧘 Постарайтесь расслабиться, избегайте стресса',
            '🧂 Ограничьте соль в пище',
            '☕ Избегайте кофеина',
            '📊 Повторите измерение через 15-30 минут',
            '📱 Если давление не снижается - свяжитесь с врачом'
        ];
    }
    // Пониженное давление
    else if (systolic < 100 || diastolic < 70) {
        result.status = 'warning';
        result.message = `⚠️ Пониженное давление: ${systolic}/${diastolic} мм рт. ст.`;
        result.recommendations = [
            '💧 Выпейте стакан воды',
            '☕ Можно выпить чай или кофе',
            '🛋️ При головокружении - присядьте или прилягте',
            '🚶 Избегайте резких движений',
            '📊 Если часто бывает низкое давление - обсудите с врачом'
        ];
    }
    // Нормальное давление
    else {
        result.status = 'normal';
        result.message = `✅ Давление в норме: ${systolic}/${diastolic} мм рт. ст.`;
        result.recommendations = [
            '👍 Отлично! Продолжайте следить за здоровьем',
            '📊 Регулярно измеряйте давление'
        ];
    }

    return result;
}

/**
 * Анализ пульса
 * @param {number} value - Частота пульса (уд/мин)
 * @returns {Object} - {status, message, recommendations}
 */
function analyzePulse(value) {
    const result = {
        status: 'normal',
        message: '',
        recommendations: []
    };

    // Критически низкий пульс (брадикардия)
    if (value < 50) {
        result.status = 'critical';
        result.message = `🚨 ВНИМАНИЕ! Критически низкий пульс: ${value} уд/мин`;
        result.recommendations = [
            '❗ Свяжитесь с врачом',
            '🛋️ Если чувствуете слабость, головокружение - лягте',
            '☎️ При потере сознания - скорая помощь (103, 112)',
            '💊 Не принимайте лекарства, снижающие пульс, без консультации врача'
        ];
        return result;
    }

    // Критически высокий пульс (тахикардия)
    if (value > 120) {
        result.status = 'critical';
        result.message = `🚨 ВНИМАНИЕ! Критически высокий пульс: ${value} уд/мин`;
        result.recommendations = [
            '🛋️ Присядьте или прилягте',
            '😮‍💨 Дышите глубоко и медленно',
            '💧 Выпейте воды',
            '🚫 Избегайте физической нагрузки',
            '☎️ Если не нормализуется или есть боль в груди - вызовите скорую',
            '📱 Свяжитесь с врачом'
        ];
        return result;
    }

    // Низкий пульс
    if (value < 60) {
        result.status = 'warning';
        result.message = `⚠️ Пульс ниже нормы: ${value} уд/мин (норма: 60-100)`;
        result.recommendations = [
            '📊 Если вы спортсмен - это может быть нормой',
            '💊 Проверьте принимаемые лекарства (некоторые снижают пульс)',
            '📱 Если часто бывает низкий пульс - обсудите с врачом'
        ];
    }
    // Высокий пульс
    else if (value > 100) {
        result.status = 'warning';
        result.message = `⚠️ Пульс выше нормы: ${value} уд/мин (норма: 60-100)`;
        result.recommendations = [
            '🧘 Постарайтесь успокоиться',
            '😮‍💨 Сделайте несколько глубоких вдохов',
            '☕ Избегайте кофеина',
            '📊 Повторите измерение через 10-15 минут в покое',
            '📱 Если пульс часто повышен - обсудите с врачом'
        ];
    }
    // Нормальный пульс
    else {
        result.status = 'normal';
        result.message = `✅ Пульс в норме: ${value} уд/мин`;
        result.recommendations = [
            '👍 Отлично! Продолжайте следить за здоровьем'
        ];
    }

    return result;
}

/**
 * Комплексный анализ - проверяет все показатели вместе
 * @param {Object} data - {glucose, systolic, diastolic, pulse}
 * @returns {Object} - Общая оценка состояния
 */
function comprehensiveAnalysis(data) {
    const results = [];
    let overallStatus = 'normal';

    if (data.glucose) {
        const glucoseAnalysis = analyzeGlucose(data.glucose, data.mealType);
        results.push({type: 'glucose', ...glucoseAnalysis});
        if (glucoseAnalysis.status === 'critical') overallStatus = 'critical';
        else if (glucoseAnalysis.status === 'warning' && overallStatus !== 'critical') overallStatus = 'warning';
    }

    if (data.systolic && data.diastolic) {
        const bpAnalysis = analyzeBloodPressure(data.systolic, data.diastolic);
        results.push({type: 'pressure', ...bpAnalysis});
        if (bpAnalysis.status === 'critical') overallStatus = 'critical';
        else if (bpAnalysis.status === 'warning' && overallStatus !== 'critical') overallStatus = 'warning';
    }

    if (data.pulse) {
        const pulseAnalysis = analyzePulse(data.pulse);
        results.push({type: 'pulse', ...pulseAnalysis});
        if (pulseAnalysis.status === 'critical') overallStatus = 'critical';
        else if (pulseAnalysis.status === 'warning' && overallStatus !== 'critical') overallStatus = 'warning';
    }

    return {
        overallStatus,
        results,
        summary: generateSummary(results, overallStatus)
    };
}

/**
 * Генерирует общую сводку
 */
function generateSummary(results, overallStatus) {
    if (overallStatus === 'critical') {
        return '🚨 Обнаружены критические показатели! Требуется немедленная медицинская помощь!';
    } else if (overallStatus === 'warning') {
        return '⚠️ Некоторые показатели выходят за пределы нормы. Следите за состоянием.';
    } else {
        return '✅ Все показатели в норме. Отличная работа!';
    }
}

module.exports = {
    analyzeGlucose,
    analyzeBloodPressure,
    analyzePulse,
    comprehensiveAnalysis
};
