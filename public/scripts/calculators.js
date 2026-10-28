(() => {
  const nf = (digits = 2) => new Intl.NumberFormat('uk-UA', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
  const fmt = (value, digits = 2) => nf(digits).format(Number.isFinite(value) ? value : 0);
  const money = (value) => `${fmt(value, 2)} грн`;
  const byField = (form, field) => Number(form.querySelector(`[data-field="${field}"]`)?.value ?? NaN);
  const validPositive = (form, fields) => fields.every((field) => Number.isFinite(byField(form, field)) && byField(form, field) > 0);
  const card = (label, value) => `<div class="result-item"><span>${label}</span><strong>${value}</strong></div>`;
  const render = (output, status, items, note = '') => {
    output.innerHTML = `<div class="result-grid">${items.map((item) => card(item.label, item.value)).join('')}</div>${note ? `<p class="result-explanation">${note}</p>` : ''}<div class="result-actions"><button class="button-secondary" type="button" data-copy-result>Скопіювати результат</button><button class="button-secondary" type="button" data-print-result>Друкувати</button></div>`;
    status.textContent = 'Розрахунок готовий.';
  };
  const error = (output, status, message) => {
    output.innerHTML = `<p class="form-error" role="alert">${message}</p>`;
    status.textContent = 'Перевірте введені значення.';
  };
  const historyKey = () => `agrocalc-history:${window.location.pathname}`;
  const loadHistory = () => {
    try { return JSON.parse(window.localStorage.getItem(historyKey()) || '[]'); } catch { return []; }
  };
  const renderHistory = (form, panel) => {
    if (!panel) return;
    const list = panel.querySelector('[data-history-list]');
    if (!list) return;
    const records = loadHistory();
    list.replaceChildren();
    if (!records.length) {
      const empty = document.createElement('p'); empty.className = 'results-placeholder'; empty.textContent = 'Після першого розрахунку тут з’явиться історія.'; list.append(empty); return;
    }
    records.forEach((record) => {
      const item = document.createElement('article'); item.className = 'history-item';
      const time = document.createElement('p'); time.className = 'history-time';
      time.textContent = new Date(record.createdAt).toLocaleString('uk-UA');
      const summary = document.createElement('p'); summary.textContent = record.summary;
      const restore = document.createElement('button'); restore.type = 'button'; restore.className = 'button-secondary'; restore.textContent = 'Відновити значення'; restore.dataset.restoreHistory = record.id;
      item.append(time, summary, restore); list.append(item);
    });
  };
  const saveHistory = (form, output) => {
    const panel = document.querySelector('[data-history]');
    if (!panel) return;
    try {
      const fields = {};
      form.querySelectorAll('[data-field]').forEach((input) => { fields[input.dataset.field] = input.value; });
      const result = output.innerText.replace('Скопіювати результат', '').replace('Друкувати', '').trim();
      const records = loadHistory();
      records.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, createdAt: new Date().toISOString(), fields, summary: result });
      window.localStorage.setItem(historyKey(), JSON.stringify(records.slice(0,5)));
      renderHistory(form, panel);
    } catch { /* History is optional when browser storage is disabled. */ }
  };

  document.querySelectorAll('form[data-calculator]').forEach((form) => {
    const output = form.parentElement?.querySelector('[data-output]');
    const status = form.parentElement?.querySelector('[data-status]');
    if (!output || !status) return;
    const historyPanel = document.querySelector('[data-history]');
    renderHistory(form, historyPanel);
    if (historyPanel) {
      historyPanel.addEventListener('click', (event) => {
        const restore = event.target.closest('[data-restore-history]');
        if (restore) {
          const record = loadHistory().find((item) => item.id === restore.dataset.restoreHistory);
          if (!record) return;
          Object.entries(record.fields || {}).forEach(([key, value]) => { const input = form.querySelector(`[data-field="${key}"]`); if (input) input.value = value; });
          form.requestSubmit();
        }
      });
      historyPanel.querySelector('[data-clear-history]')?.addEventListener('click', () => {
        try { window.localStorage.removeItem(historyKey()); } catch {}
        renderHistory(form, historyPanel);
      });
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const kind = form.dataset.calculator;
      let items = [];
      let note = '';

      if (kind === 'sowing-rate') {
        if (!validPositive(form, ['targetDensity', 'thousandSeedMass', 'germination', 'purity', 'fieldGermination', 'rowSpacing', 'area']) || byField(form, 'germination') > 100 || byField(form, 'purity') > 100 || byField(form, 'fieldGermination') > 100 || !Number.isFinite(byField(form, 'reserve')) || byField(form, 'reserve') < 0 || byField(form, 'reserve') > 100) return error(output, status, 'Введіть додатні значення. Схожість, чистота й страховий запас мають бути в межах 0–100 %.');
        const density = byField(form, 'targetDensity');
        const mass = byField(form, 'thousandSeedMass');
        const germination = byField(form, 'germination') / 100;
        const purity = byField(form, 'purity') / 100;
        const fieldGermination = byField(form, 'fieldGermination') / 100;
        const area = byField(form, 'area');
        const rowSpacing = byField(form, 'rowSpacing') / 100;
        const reserve = byField(form, 'reserve') / 100;
        const effective = germination * purity * fieldGermination;
        const seedsPerHa = density * 10000 / effective;
        const kgPerHa = seedsPerHa * mass / 1000000 * (1 + reserve);
        const totalKg = kgPerHa * area;
        const seedsMillion = seedsPerHa * (1 + reserve) / 1000000;
        const seedsPerMeter = seedsPerHa * (1 + reserve) * rowSpacing / 10000;
        items = [
          { label: 'Норма висіву', value: `${fmt(kgPerHa)} кг/га` },
          { label: 'Насіння на все поле', value: `${fmt(totalKg)} кг` },
          { label: 'Потреба на поле', value: `${fmt(totalKg / 1000)} т` },
          { label: 'Насінин до висіву', value: `${fmt(seedsMillion)} млн/га` },
          { label: 'На 1 метр рядка', value: `${fmt(seedsPerMeter, 1)} шт.` },
          { label: 'Ефективна схожість', value: `${fmt(effective * 100, 1)} %` },
        ];
        note = 'Результат залежить від заданої густоти, якості партії та оцінки польової схожості. Звірте норму з рекомендаціями для вашої культури.';
      } else if (kind === 'fertilizer-rate') {
        if (!validPositive(form, ['nutrient', 'content', 'area']) || byField(form, 'content') > 100) return error(output, status, 'Перевірте норму, площу та відсоток вмісту речовини (від 0 до 100 %).');
        const kgPerHa = byField(form, 'nutrient') * 100 / byField(form, 'content');
        const totalKg = kgPerHa * byField(form, 'area');
        items = [
          { label: 'Фізична маса', value: `${fmt(kgPerHa)} кг/га` },
          { label: 'Загалом на поле', value: `${fmt(totalKg)} кг` },
          { label: 'Загальна потреба', value: `${fmt(totalKg / 1000)} т` },
        ];
        note = 'Використано задану потребу в діючій речовині. Перевірте, що відсоток на етикетці відповідає саме цьому елементу.';
      } else if (kind === 'spray-solution') {
        if (!validPositive(form, ['area', 'waterRate', 'tankCapacity']) || !Number.isFinite(byField(form, 'productRate')) || byField(form, 'productRate') < 0) return error(output, status, 'Введіть додатну площу, норму води й місткість бака. Норма препарату не може бути від’ємною.');
        const area = byField(form, 'area');
        const water = area * byField(form, 'waterRate');
        const product = area * byField(form, 'productRate');
        const tanks = Math.ceil(water / byField(form, 'tankCapacity'));
        items = [
          { label: 'Вода на все поле', value: `${fmt(water)} л` },
          { label: 'Препарат на все поле', value: `${fmt(product)} л або кг` },
          { label: 'Кількість заправок', value: `${fmt(tanks, 0)}` },
          { label: 'Місткість бака', value: `${fmt(byField(form, 'tankCapacity'), 0)} л` },
        ];
        note = 'Кількість заправок округлена вгору. Перевірте норми, одиниці та регламент на етикетці препарату.';
      } else if (kind === 'field-area') {
        if (!validPositive(form, ['length', 'width'])) return error(output, status, 'Введіть довжину та ширину ділянки більше за нуль.');
        const sqm = byField(form, 'length') * byField(form, 'width');
        items = [
          { label: 'Площа, м²', value: `${fmt(sqm, 0)} м²` },
          { label: 'Площа, га', value: `${fmt(sqm / 10000, 4)} га` },
          { label: 'Площа, соток', value: `${fmt(sqm / 100, 2)}` },
          { label: 'Площа, акрів', value: `${fmt(sqm / 4046.8564224, 3)}` },
        ];
        note = 'Формула точна для прямокутної ділянки. Для нерегулярного поля потрібне окреме вимірювання контуру.';
      } else if (kind === 'fuel-cost') {
        if (!validPositive(form, ['area', 'consumption']) || !Number.isFinite(byField(form, 'price')) || byField(form, 'price') < 0) return error(output, status, 'Введіть додатну площу та витрату. Ціна пального не може бути від’ємною.');
        const litres = byField(form, 'area') * byField(form, 'consumption');
        items = [
          { label: 'Пальне на все поле', value: `${fmt(litres)} л` },
          { label: 'Вартість на гектар', value: money(byField(form, 'consumption') * byField(form, 'price')) },
          { label: 'Загальна вартість', value: money(litres * byField(form, 'price')) },
        ];
        note = 'Використано введену витрату пального. Фактичні значення змінюються залежно від операції, техніки та ґрунту.';
      } else if (kind === 'machinery-productivity') {
        if (!validPositive(form, ['width', 'speed', 'efficiency', 'area']) || byField(form, 'efficiency') > 100) return error(output, status, 'Перевірте робочу ширину, швидкість, площу та коефіцієнт використання часу (1–100 %).');
        const theoretical = byField(form, 'width') * byField(form, 'speed') / 10;
        const practical = theoretical * byField(form, 'efficiency') / 100;
        const hours = byField(form, 'area') / practical;
        items = [
          { label: 'Теоретична продуктивність', value: `${fmt(theoretical)} га/год` },
          { label: 'Орієнтовна фактична', value: `${fmt(practical)} га/год` },
          { label: 'Час на задану площу', value: `${fmt(hours)} год` },
          { label: 'За 8-годинну зміну', value: `${fmt(practical * 8)} га` },
        ];
        note = 'Коефіцієнт використання часу враховує розвороти, заправки й інші простої, якщо вони включені у вашу оцінку.';
      } else if (kind === 'fertilizer-cost') {
        if (!validPositive(form, ['yield', 'area']) || !Number.isFinite(byField(form, 'rate')) || byField(form, 'rate') < 0 || !Number.isFinite(byField(form, 'price')) || byField(form, 'price') < 0) return error(output, status, 'Врожайність і площа мають бути більшими за нуль; норма й ціна не можуть бути від’ємними.');
        const perHa = byField(form, 'rate') * byField(form, 'price') / 1000;
        const total = perHa * byField(form, 'area');
        items = [
          { label: 'Вартість добрив на гектар', value: money(perHa) },
          { label: 'Вартість на тонну врожаю', value: money(perHa / byField(form, 'yield')) },
          { label: 'Бюджет на всю площу', value: money(total) },
          { label: 'Маса продукту на поле', value: `${fmt(byField(form, 'rate') * byField(form, 'area') / 1000)} т` },
        ];
        note = 'Не включено доставку, зберігання, внесення, податки або інші витрати, якщо вони не враховані в заданій ціні.';
      } else if (kind === 'yield') {
        if (!Number.isFinite(byField(form, 'harvest')) || byField(form, 'harvest') < 0 || !validPositive(form, ['area'])) return error(output, status, 'Введіть не від’ємну масу врожаю та площу, більшу за нуль.');
        const perHa = byField(form, 'harvest') / byField(form, 'area');
        items = [
          { label: 'Урожайність', value: `${fmt(perHa)} т/га` },
          { label: 'Урожайність у центнерах', value: `${fmt(perHa * 10)} ц/га` },
          { label: 'Урожай на площу', value: `${fmt(byField(form, 'harvest'))} т` },
        ];
        note = 'Розрахунок використовує введену масу й не коригує її за вологістю або домішками.';
      } else if (kind === 'seed-cost') {
        if (!validPositive(form, ['rate', 'area']) || !Number.isFinite(byField(form, 'price')) || byField(form, 'price') < 0) return error(output, status, 'Перевірте норму, площу та невід’ємну ціну насіння.');
        const massKg = byField(form, 'rate') * byField(form, 'area');
        const perHa = byField(form, 'rate') * byField(form, 'price') / 1000;
        items = [{ label: 'Вартість насіння на гектар', value: money(perHa) }, { label: 'Потрібно насіння на поле', value: `${fmt(massKg)} кг` }, { label: 'Маса на все поле', value: `${fmt(massKg / 1000)} т` }, { label: 'Загальний бюджет', value: money(perHa * byField(form, 'area')) }];
        note = 'Не включено доставку, протруювання чи інші послуги, якщо вони не входять у введену ціну.';
      } else if (kind === 'plant-population') {
        if (!validPositive(form, ['rowSpacing', 'plantSpacing', 'area'])) return error(output, status, 'Міжряддя, відстань у рядку та площа мають бути більшими за нуль.');
        const rowM = byField(form, 'rowSpacing') / 100; const plantM = byField(form, 'plantSpacing') / 100;
        const plantsHa = 10000 / (rowM * plantM); const plantsM2 = plantsHa / 10000;
        items = [{ label: 'Рослин на гектар', value: `${fmt(plantsHa, 0)} шт.` }, { label: 'Рослин на м²', value: `${fmt(plantsM2, 2)} шт.` }, { label: 'Рослин на 10 м рядка', value: `${fmt(10 / plantM, 1)} шт.` }, { label: 'Рослин на задану площу', value: `${fmt(plantsHa * byField(form, 'area'), 0)} шт.` }];
        note = 'Ідеалізована схема без урахування сходів, пропусків, двійників або загибелі рослин.';
      } else if (kind === 'irrigation-water') {
        if (!validPositive(form, ['area', 'depth', 'efficiency']) || byField(form, 'efficiency') > 100) return error(output, status, 'Перевірте площу, шар поливу та ефективність системи (до 100 %).');
        const net = byField(form, 'area') * byField(form, 'depth') * 10; const gross = net / (byField(form, 'efficiency') / 100);
        items = [{ label: 'Теоретичний об’єм води', value: `${fmt(net)} м³` }, { label: 'Об’єм з урахуванням ефективності', value: `${fmt(gross)} м³` }, { label: 'Літрів на задану площу', value: `${fmt(gross * 1000, 0)} л` }, { label: 'Об’єм на гектар з поправкою', value: `${fmt(gross / byField(form, 'area'))} м³/га` }];
        note = 'Ефективність — введене вами припущення. Це розрахунок обсягу, а не рекомендація щодо потреби культури у воді.';
      } else if (kind === 'nozzle-flow') {
        if (!validPositive(form, ['rate', 'speed', 'nozzleSpacing', 'nozzles']) || !Number.isInteger(byField(form, 'nozzles'))) return error(output, status, 'Параметри мають бути більшими за нуль, а кількість форсунок — цілим числом.');
        const perNozzle = byField(form, 'rate') * byField(form, 'speed') * byField(form, 'nozzleSpacing') / 60000; const total = perNozzle * byField(form, 'nozzles');
        items = [{ label: 'Витрата однієї форсунки', value: `${fmt(perNozzle, 3)} л/хв` }, { label: 'Загальна витрата', value: `${fmt(total, 2)} л/хв` }, { label: 'Витрата за годину', value: `${fmt(total * 60)} л/год` }];
        note = 'Формула для типової штангової схеми з рівномірним кроком форсунок. Перевірте результат фактичним вимірюванням.';
      } else if (kind === 'harvest-loss') {
        if (!validPositive(form, ['sampleArea']) || !Number.isFinite(byField(form, 'sampleMass')) || byField(form, 'sampleMass') < 0 || !Number.isFinite(byField(form, 'grainPrice')) || byField(form, 'grainPrice') < 0) return error(output, status, 'Перевірте масу зразка, площу та ціну зерна.');
        const kgHa = byField(form, 'sampleMass') / byField(form, 'sampleArea') * 10; const tHa = kgHa / 1000;
        items = [{ label: 'Втрати за виміром', value: `${fmt(kgHa)} кг/га` }, { label: 'Втрати в тоннах', value: `${fmt(tHa, 4)} т/га` }, { label: 'Оцінка вартості на гектар', value: money(tHa * byField(form, 'grainPrice')) }];
        note = 'Оцінка вартості базується на введеній ціні. Метод відбору контрольної площі впливає на репрезентативність вимірювання.';
      } else if (kind === 'grain-moisture') {
        if (!validPositive(form, ['mass']) || !Number.isFinite(byField(form, 'currentMoisture')) || !Number.isFinite(byField(form, 'targetMoisture')) || byField(form, 'currentMoisture') < 0 || byField(form, 'currentMoisture') >= 100 || byField(form, 'targetMoisture') < 0 || byField(form, 'targetMoisture') >= 100) return error(output, status, 'Маса має бути більшою за нуль, а вологість — у межах від 0 до менш ніж 100 %.');
        const mass = byField(form, 'mass'); const current = byField(form, 'currentMoisture'); const target = byField(form, 'targetMoisture');
        const adjusted = mass * (100 - current) / (100 - target);
        items = [{ label: 'Маса після перерахунку', value: `${fmt(adjusted)} т` }, { label: 'Різниця маси', value: `${fmt(mass - adjusted)} т` }, { label: 'Початкова маса', value: `${fmt(mass)} т` }];
        note = 'Математична поправка за вологістю за припущення незмінної маси сухої речовини. Домішки, усушку та правила приймання не враховано.';
      } else if (kind === 'crop-profit') {
        if (!validPositive(form, ['yield', 'area']) || !Number.isFinite(byField(form, 'price')) || byField(form, 'price') < 0 || !Number.isFinite(byField(form, 'costs')) || byField(form, 'costs') < 0) return error(output, status, 'Перевірте врожайність, ціну, витрати та площу.');
        const revenueHa = byField(form, 'yield') * byField(form, 'price'); const marginHa = revenueHa - byField(form, 'costs');
        items = [{ label: 'Валовий дохід на гектар', value: money(revenueHa) }, { label: 'Маржа за введеними витратами на гектар', value: money(marginHa) }, { label: 'Дохід на всю площу', value: money(revenueHa * byField(form, 'area')) }, { label: 'Маржа на всю площу', value: money(marginHa * byField(form, 'area')) }];
        note = 'Маржа не є чистим прибутком, якщо враховано не всі витрати, податки, логістику, фінансування та інші складові.';
      } else if (kind === 'break-even-yield') {
        if (!validPositive(form, ['price', 'area']) || !Number.isFinite(byField(form, 'costPerHa')) || byField(form, 'costPerHa') < 0) return error(output, status, 'Ціна й площа мають бути більшими за нуль; витрати не можуть бути від’ємними.');
        const cost = byField(form, 'costPerHa'); const price = byField(form, 'price'); const area = byField(form, 'area');
        items = [{ label: 'Точка беззбитковості', value: `${fmt(cost / price)} т/га` }, { label: 'Загальні витрати на площу', value: money(cost * area) }, { label: 'Маса для покриття витрат', value: `${fmt((cost / price) * area)} т` }];
        note = 'Враховуються лише зазначені витрати та введена ціна. Додаткові доходи, витрати, податки й втрати потрібно врахувати окремо.';
      } else if (kind === 'spray-cost') {
        if (!validPositive(form, ['area']) || !Number.isFinite(byField(form, 'rate')) || byField(form, 'rate') < 0 || !Number.isFinite(byField(form, 'price')) || byField(form, 'price') < 0) return error(output, status, 'Перевірте норму продукту, ціну та площу.');
        const amount = byField(form, 'rate') * byField(form, 'area'); const perHa = byField(form, 'rate') * byField(form, 'price');
        items = [{ label: 'Вартість продукту на гектар', value: money(perHa) }, { label: 'Потрібна кількість продукту', value: `${fmt(amount)}` }, { label: 'Вартість продукту на площу', value: money(perHa * byField(form, 'area')) }];
        note = 'Ціна й норма мають використовувати узгоджені одиниці: наприклад, л/га та грн/л або кг/га та грн/кг.';
      } else if (kind === 'tank-concentration') {
        if (!Number.isFinite(byField(form, 'dosePer100L')) || byField(form, 'dosePer100L') < 0 || !validPositive(form, ['volume', 'tankCapacity'])) return error(output, status, 'Норма може бути нульовою або додатною; об’єми мають бути більшими за нуль.');
        const dose = byField(form, 'dosePer100L'); const volume = byField(form, 'volume'); const tank = byField(form, 'tankCapacity');
        items = [{ label: 'Продукт на весь об’єм', value: `${fmt(dose * volume / 100)} (мл або г)` }, { label: 'Продукт на один повний бак', value: `${fmt(dose * tank / 100)} (мл або г)` }, { label: 'Кількість заправок', value: `${fmt(Math.ceil(volume / tank), 0)}` }, { label: 'Об’єм води', value: `${fmt(volume)} л` }];
        note = 'Одиницею може бути мл або г — її потрібно зберігати такою самою, як на етикетці. Грами не переводяться в мілілітри.';
      } else if (kind === 'machinery-cost') {
        if (!validPositive(form, ['area']) || !Number.isFinite(byField(form, 'fuelRate')) || byField(form, 'fuelRate') < 0 || !Number.isFinite(byField(form, 'fuelPrice')) || byField(form, 'fuelPrice') < 0 || !Number.isFinite(byField(form, 'otherCost')) || byField(form, 'otherCost') < 0) return error(output, status, 'Витрати й ціни не можуть бути від’ємними; перевірте площу.');
        const area = byField(form, 'area'); const fuel = byField(form, 'fuelRate') * byField(form, 'fuelPrice'); const perHa = fuel + byField(form, 'otherCost');
        items = [{ label: 'Вартість пального на гектар', value: money(fuel) }, { label: 'Загальні введені витрати на гектар', value: money(perHa) }, { label: 'Пального на всю площу', value: `${fmt(byField(form, 'fuelRate') * area)} л` }, { label: 'Бюджет робіт на всю площу', value: money(perHa * area) }];
        note = 'Інші витрати рахуйте без дублювання. Результат не є ринковим тарифом на послугу.';
      } else if (kind === 'rate-conversion') {
        if (!Number.isFinite(byField(form, 'rate')) || byField(form, 'rate') < 0) return error(output, status, 'Норма має бути нульовою або додатною.');
        const rate = byField(form, 'rate');
        items = [{ label: 'Грамів на 1 м²', value: `${fmt(rate / 10, 4)} г/м²` }, { label: 'Грамів на 100 м²', value: `${fmt(rate * 10)} г` }, { label: 'Кілограмів на 10 соток', value: `${fmt(rate / 10)} кг` }, { label: 'Площа у гектарах', value: '1 га = 10 000 м²' }];
        note = 'Це лише перерахунок одиниць. Він не визначає рекомендовану норму застосування.';
      } else if (kind === 'grain-revenue') {
        if (!validPositive(form, ['yield', 'area']) || !Number.isFinite(byField(form, 'price')) || byField(form, 'price') < 0) return error(output, status, 'Перевірте врожайність, ціну та площу.');
        const tonnes = byField(form, 'yield') * byField(form, 'area'); const perHa = byField(form, 'yield') * byField(form, 'price');
        items = [{ label: 'Валовий дохід на гектар', value: money(perHa) }, { label: 'Маса урожаю на всю площу', value: `${fmt(tonnes)} т` }, { label: 'Валовий дохід на всю площу', value: money(tonnes * byField(form, 'price')) }];
        note = 'Валовий дохід не є чистим прибутком і не враховує виробничі, логістичні, податкові чи фінансові витрати.';
      } else if (kind === 'nutrient-cost') {
        if (!validPositive(form, ['price', 'nutrientContent']) || byField(form, 'nutrientContent') > 100) return error(output, status, 'Ціна має бути додатною, а вміст речовини — у межах до 100 %.');
        const amount = byField(form, 'nutrientContent') * 10; const costPerKg = byField(form, 'price') / amount;
        items = [{ label: 'Кілограмів речовини в тонні продукту', value: `${fmt(amount)} кг` }, { label: 'Вартість кілограма речовини', value: money(costPerKg) }, { label: 'Ціна тонни продукту', value: money(byField(form, 'price')) }];
        note = 'Порівнюйте однакові поживні речовини та форми показника, зазначені на етикетці. Агрономічна ефективність не оцінюється.';
      }
      if (items.length) {
        render(output, status, items, note);
        saveHistory(form, output);
      }
    });

    form.addEventListener('reset', () => {
      window.setTimeout(() => {
        output.innerHTML = '<p class="results-placeholder">Змініть прикладові значення за потреби й натисніть «Розрахувати».</p>';
        status.textContent = '';
      }, 0);
    });

    output.addEventListener('click', async (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.hasAttribute('data-print-result')) {
        window.print();
      } else if (button.hasAttribute('data-copy-result')) {
        const resultText = output.innerText.replace('Скопіювати результат', '').replace('Друкувати', '').trim();
        try {
          await navigator.clipboard.writeText(resultText);
          status.textContent = 'Результат скопійовано.';
        } catch {
          status.textContent = 'Браузер не дозволив копіювання. Виділіть результат і скопіюйте його вручну.';
        }
      }
    });
  });
})();
