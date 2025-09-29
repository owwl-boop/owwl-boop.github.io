// グローバルに材料DBと履歴配列を定義
let MATERIAL_DB = {
    '化粧材': [
        { name: 'ポリ合板LP', spec: '3*6', price: 5000 },
        { name: 'ポリ合板LP', spec: '4*8', price: 9500 },
        { name: 'ポリ合板BB', spec: '3*6', price: 4000 },
        { name: 'ポリ合板BB', spec: '4*8', price: 8000 },
        { name: 'メラミン化粧板K,TS,JC', spec: '3*6', price: 6000 },
        { name: 'メラミン化粧板K,TS,JC', spec: '4*8', price: 11000 },
        { name: 'メラミン化粧板SAI,TJ', spec: '3*6', price: 6500 },
        { name: 'メラミン化粧板SAI,TJ', spec: '4*8', price: 12000 },
        { name: 'シナ合板', spec: '3*6', price: 2500 },
        { name: 'シナ合板', spec: '4*8', price: 4500 },
    ],
    '下地材': [
        { name: '下地材', spec: '芯材', price: 4200 },
        { name: 'ラワンベニヤ2.5mm', spec: '3*6', price: 900 },
        { name: 'ラワンベニヤ2.5mm', spec: '4*8', price: 1800 },
        { name: 'ラワンランバー15mm', spec: '3*6', price: 2300 },
        { name: 'ラワンランバー15mm', spec: '4*8', price: 4000 },
        { name: 'ラワンランバー18mm', spec: '3*6', price: 2700 },
        { name: 'ラワンランバー18mm', spec: '4*8', price: 4200 },
        { name: 'ラワンランバー24mm', spec: '3*6', price: 3500 },
        { name: 'ラワンランバー24mm', spec: '4*8', price: 6200 },
    ],
    '金物': [
        { name: 'スライドレール', spec: 'H-350', price: 1500 },
        { name: '丁番（ペア）', spec: 'HH-01', price: 800 },
    ],
    '外注費': [
        { name: '塗装費用 (㎡)', spec: 'PAINT-M', price: 3000 },
        { name: '特殊加工 (一式)', spec: 'SPECIAL', price: 15000 }, 
    ]
};
let estimatesHistory = [];

// ページロード時に実行される初期化関数
document.addEventListener('DOMContentLoaded', () => {
    loadInitialData(); // DBと履歴をlocalStorageからロード
    renderHistory();
    document.getElementById('estimateNumber').value = generateEstimateNumber();
    
    // 初回ロード時に材料行を1つずつ追加します
    for (const category in MATERIAL_DB) {
         // falseを指定して、DOMに材料行を挿入
         addMaterial(category, false); 
         // カスタム材料行も挿入
         addCustomMaterial(category);
    }
});

// 金額を日本円形式に変換するヘルパー関数
function formatJpy(amount) {
    return `¥${Math.round(amount).toLocaleString()}`;
}

// ----------------------------------------------------
// 1. 単価マスタ編集機能 (Modal / LocalStorage)
// ----------------------------------------------------

// LocalStorageから単価DBと履歴を読み込む
function loadInitialData() {
    const storedDB = localStorage.getItem('materialDB');
    if (storedDB) {
        MATERIAL_DB = JSON.parse(storedDB);
    }
    const storedHistory = localStorage.getItem('estimatesHistory');
    if (storedHistory) {
        estimatesHistory = JSON.parse(storedHistory);
    }
}

// 新しい材料をDBに追加する関数
function addNewMaterialToDB() {
    const category = document.getElementById('newMaterialCategory').value;
    const name = document.getElementById('newMaterialName').value.trim();
    const spec = document.getElementById('newMaterialSpec').value.trim();
    const price = parseFloat(document.getElementById('newMaterialPrice').value) || 0;

    if (!name || price < 0) {
        alert("材料名を入力し、単価は0以上の値を設定してください。");
        return;
    }

    // 既に存在する材料名と規格の組み合わせがないかチェック
    const exists = MATERIAL_DB[category].some(mat => 
        mat.name === name && mat.spec === spec
    );

    if (exists) {
        alert(`このカテゴリに同じ名前と規格の材料が既に存在します。\n既存の材料を編集してください。`);
        return;
    }

    // 新しい材料をDBに追加
    MATERIAL_DB[category].push({
        name: name,
        spec: spec,
        price: price
    });
    
    // LocalStorageに保存
    localStorage.setItem('materialDB', JSON.stringify(MATERIAL_DB));

    alert(`${name} (${category}) をマスタに追加しました。\nプルダウンに反映させるため、画面を再ロードします。`);
    location.reload(); 
}

// 単価マスタ編集モーダルを開く
function openPriceModal() {
    const editor = document.getElementById('modalPriceEditor');
    editor.innerHTML = '';
    
    for (const category in MATERIAL_DB) {
        editor.innerHTML += `<h3>${category}</h3>`;
        MATERIAL_DB[category].forEach((material, index) => {
            const specDisplay = material.spec ? ` (${material.spec})` : '';
            editor.innerHTML += `
                <div class="edit-item">
                    <span>${material.name}${specDisplay}</span>
                    <input type="number" 
                        class="price-input" 
                        data-category="${category}" 
                        data-index="${index}" 
                        value="${material.price}" 
                        min="0">
                </div>
            `;
        });
    }
    document.getElementById('priceModal').style.display = 'block';
}

// 単価マスタ編集モーダルを閉じる
function closePriceModal() {
    document.getElementById('priceModal').style.display = 'none';
}

// 単価マスタの変更を保存し、画面をリロード
function savePriceChanges() {
    const inputs = document.querySelectorAll('#modalPriceEditor .price-input');
    // ディープコピーを使って新しいDBを作成
    const newDB = JSON.parse(JSON.stringify(MATERIAL_DB));
    
    inputs.forEach(input => {
        const category = input.getAttribute('data-category');
        const index = parseInt(input.getAttribute('data-index'));
        const newPrice = parseFloat(input.value) || 0;
        
        newDB[category][index].price = newPrice;
    });

    MATERIAL_DB = newDB;
    localStorage.setItem('materialDB', JSON.stringify(MATERIAL_DB));
    closePriceModal();
    
    alert('単価マスタが更新されました。画面を再ロードします。');
    location.reload(); 
}

// ----------------------------------------------------
// 2. 履歴機能 (LocalStorage)
// ----------------------------------------------------

// 見積もり番号の生成 (YYYYMMDD-連番)
function generateEstimateNumber() {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    
    // 本日の履歴数を連番として使用
    const todayHistoryCount = estimatesHistory.filter(h => h.id.startsWith(`${yyyy}${mm}${dd}`)).length;
    const sequence = String(todayHistoryCount + 1).padStart(3, '0');
    
    return `${yyyy}${mm}${dd}-${sequence}`;
}

// 履歴一覧を描画する
function renderHistory() {
    const listElement = document.getElementById('historyList');
    listElement.innerHTML = '';
    
    if (estimatesHistory.length === 0) {
        listElement.textContent = '履歴はありません。';
        return;
    }
    
    // 最新のものが上に来るように逆順で表示
    estimatesHistory.slice().reverse().forEach(item => {
        const finalPriceDisplay = item.finalPriceNoTax !== undefined 
            ? `(税別${formatJpy(item.finalPriceNoTax)})`
            : `(${formatJpy(item.finalPrice)})`;

        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <span onclick="loadEstimate('${item.id}')" title="クリックして読み込み">
                ${item.date} / ${item.number} / ${item.productName} 
                ${finalPriceDisplay}
            </span>
            <button onclick="deleteEstimate('${item.id}')">削除</button>
        `;
        listElement.appendChild(div);
    });
}

// 履歴を読み込む
function loadEstimate(id) {
    const item = estimatesHistory.find(h => h.id === id);
    if (!item) return;

    // 1. 基本情報と利益率の復元
    document.getElementById('productName').value = item.productName;
    document.getElementById('estimateNumber').value = item.number;
    document.getElementById('laborDays').value = item.laborDays;
    document.getElementById('dailyLaborRate').value = item.dailyLaborRate;
    document.getElementById('materialProfitRate').value = item.materialProfitRatePercent;
    document.getElementById('projectProfitRate').value = item.projectProfitRatePercent;

    // 2. 材料リストの復元 (プルダウンとカスタムの両方をクリア)
    for (const category in MATERIAL_DB) {
        document.getElementById(`materialsList_${category}`).innerHTML = '';
        document.getElementById(`customList_${category}`).innerHTML = ''; 
    }

    // 新しい材料リストを挿入
    item.materials.forEach(mat => {
        const listId = mat.isCustom ? `customList_${mat.category}` : `materialsList_${mat.category}`;
        const list = document.getElementById(listId);
        
        const itemDiv = document.createElement('div');
        itemDiv.className = mat.isCustom ? 'custom-item' : 'material-item';
        
        if (mat.isCustom) {
            // カスタム材料の復元
            itemDiv.innerHTML = `
                <input type="text" class="custom-name" value="${mat.name}" placeholder="材料名">
                <input type="number" class="quantity" value="${mat.quantity}" min="1" placeholder="数量">
                <input type="number" class="unitPrice custom-unitPrice" value="${mat.unitPrice}" min="0" placeholder="単価 (円)">
                <button onclick="removeMaterial(this)">削除</button>
            `;
            list.appendChild(itemDiv); 
        } else {
            // プルダウン材料の復元
            const selectHtml = `<select class="name-select" onchange="updateUnitPrice(this)">${generateOptions(mat.category)}</select>`;
            itemDiv.innerHTML = `
                <div class="name-select">${selectHtml}</div>
                <input type="number" class="quantity" value="${mat.quantity}" min="1" placeholder="使用枚数/数量">
                <input type="number" class="unitPrice" value="${mat.unitPrice}" min="0" placeholder="単価 (円)" readonly>
                <button onclick="removeMaterial(this)">削除</button>
            `;
            list.appendChild(itemDiv); 

            // 復元した値を選択状態にする
            const selectElement = itemDiv.querySelector('.name-select select'); 
            
            // 復元に必要な形式のoption valueを再構築
            const optionValue = `${mat.name};${mat.spec || ''};${mat.unitPrice}`; 
            
            if (selectElement) {
                 selectElement.value = optionValue;
            }
        }
    });
    
    // 再計算して結果欄を更新 (保存はしない)
    calculateEstimate(false); 
    alert(`見積もり番号 ${item.number} を読み込みました。`);
}

// 履歴を削除する
function deleteEstimate(id) {
    if (!confirm('この履歴を本当に削除しますか？')) return;
    
    estimatesHistory = estimatesHistory.filter(h => h.id !== id);
    localStorage.setItem('estimatesHistory', JSON.stringify(estimatesHistory));
    renderHistory();
}

// 履歴を保存する
function saveEstimate(results) {
    const now = new Date();
    const id = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${now.getTime().toString()}`; 

    // materialsはcalculateEstimateから渡されたものを使用
    const materials = results.materials; 

    // 見積もりオブジェクトを作成
    const newEstimate = {
        id: id,
        date: now.toLocaleDateString(),
        number: document.getElementById('estimateNumber').value,
        productName: document.getElementById('productName').value,
        laborDays: parseFloat(document.getElementById('laborDays').value),
        dailyLaborRate: parseFloat(document.getElementById('dailyLaborRate').value),
        materialProfitRatePercent: parseFloat(document.getElementById('materialProfitRate').value),
        projectProfitRatePercent: parseFloat(document.getElementById('projectProfitRate').value),
        
        // 結果
        finalPrice: results.finalPrice,
        finalPriceNoTax: results.finalPriceNoTax, // 税別価格を保存
        materials: materials,
    };

    estimatesHistory.push(newEstimate);
    localStorage.setItem('estimatesHistory', JSON.stringify(estimatesHistory));
    renderHistory();
    document.getElementById('estimateNumber').value = generateEstimateNumber(); // 次の番号を準備
}

// ----------------------------------------------------
// 3. DOM操作と計算ロジック
// ----------------------------------------------------

// 選択されたカテゴリのプルダウンオプションHTMLを生成する関数
function generateOptions(category) {
    let optionsHtml = '<option value="0">--- 材料を選択 ---</option>';
    const materials = MATERIAL_DB[category];
    
    if (materials) {
        materials.forEach(material => {
            // name, spec, priceが必ず存在することを保証
            const name = material.name || '';
            const spec = material.spec || '';
            const price = material.price || 0;
            
            // 3つの要素をセミコロンで区切って値を作成
            const optionValue = `${name};${spec};${price}`; 
            
            const optionLabel = `${name}${spec ? ' (' + spec + ')' : ''}`;
            optionsHtml += `<option value="${optionValue}">${optionLabel}</option>`;
        });
    }
    return optionsHtml;
}

// プルダウンの材料行を追加
function addMaterial(category, isInitial = false) {
    const list = document.getElementById(`materialsList_${category}`);
    if (!list && !isInitial) return;

    const item = document.createElement('div');
    item.className = 'material-item';
    
    // selectタグに初期値(value="0")を直接指定
    const selectHtml = `<select class="name-select" onchange="updateUnitPrice(this)" value="0">${generateOptions(category)}</select>`;

    item.innerHTML = `
        <div class="name-select">${selectHtml}</div>
        <input type="number" class="quantity" value="1" min="1" placeholder="使用枚数/数量">
        <input type="number" class="unitPrice" value="0" min="0" placeholder="単価 (円)" readonly>
        <button onclick="removeMaterial(this)">削除</button>
    `;
    // 初期描画時はDOMへの追加をスキップ
    if (!isInitial) list.appendChild(item);
}

// 自由記述のカスタム材料行を追加
function addCustomMaterial(category) {
    const list = document.getElementById(`customList_${category}`);
    if (!list) return;

    const item = document.createElement('div');
    item.className = 'custom-item';

    item.innerHTML = `
        <input type="text" class="custom-name" placeholder="材料名 (自由記述)">
        <input type="number" class="quantity" value="1" min="1" placeholder="数量">
        <input type="number" class="unitPrice custom-unitPrice" value="0" min="0" placeholder="単価 (円)">
        <button onclick="removeMaterial(this)">削除</button>
    `;
    list.appendChild(item);
}

// プルダウン選択時に単価を自動更新する関数
function updateUnitPrice(selectElement) {
    const selectedValue = selectElement.value;
    const unitPriceInput = selectElement.closest('.material-item').querySelector('.unitPrice');

    // 選択値が '0' (--- 材料を選択 ---) または値がない場合は単価を0にして終了
    if (selectedValue === '0' || !selectedValue) {
        if (unitPriceInput) unitPriceInput.value = 0;
        return;
    }
    
    // selectedValueが文字列でない、または空の場合は処理を中断
    if (typeof selectedValue !== 'string' || selectedValue.trim() === '') {
        console.error("updateUnitPrice: 不正な値が渡されました。");
        if (unitPriceInput) unitPriceInput.value = 0;
        return;
    }

    const parts = selectedValue.split(';');
    
    // 分割後の配列の長さが3未満の場合は、処理を中止します
    if (parts.length < 3) {
        console.error("材料選択の値が不正です (要素不足):", selectedValue);
        if (unitPriceInput) unitPriceInput.value = 0;
        return;
    }

    const price = parseFloat(parts[2]) || 0;
    
    if (unitPriceInput) unitPriceInput.value = price;
}

// 材料の行を削除する関数 (プルダウン/カスタム両方対応)
function removeMaterial(button) {
    button.closest('.material-item, .custom-item').remove(); 
}

// 材料費の内訳を表示する関数 (リスト表示用)
function displayMaterialBreakdown(materials) {
    const breakdownElement = document.getElementById('outputMaterialBreakdown');
    breakdownElement.innerHTML = '';

    const categoryTotals = {};
    materials.forEach(mat => {
        if (!categoryTotals[mat.category]) {
            categoryTotals[mat.category] = { subtotal: 0, items: [] };
        }
        const itemCost = mat.quantity * mat.unitPrice;
        categoryTotals[mat.category].subtotal += itemCost;
        
        const nameDisplay = mat.isCustom 
            ? `[カスタム] ${mat.name}` 
            : `${mat.name} (${mat.spec || '規格なし'})`;
        
        categoryTotals[mat.category].items.push({
            name: nameDisplay,
            quantity: mat.quantity,
            unitPrice: mat.unitPrice,
            cost: itemCost
        });
    });

    for (const category in categoryTotals) {
        let categoryHtml = `
            <h4 style="margin-top: 15px; color: #3498db; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${category}</h4>
            <ul style="list-style-type: none; padding-left: 0; font-size: 0.9em; border-bottom: 1px dotted #eee; padding-bottom: 5px;">
        `;

        // 1. 個別の材料行
        categoryTotals[category].items.forEach(item => {
            categoryHtml += `
                <li style="display: flex; justify-content: space-between; padding: 2px 0;">
                    <span style="flex: 3;">${item.name}</span>
                    <span style="flex: 1; text-align: right;">${item.quantity.toLocaleString()} 個/枚</span>
                    <span style="flex: 1; text-align: right;">${formatJpy(item.unitPrice)}</span>
                    <span style="flex: 1; text-align: right;">${formatJpy(item.cost)}</span>
                </li>
            `;
        });
        categoryHtml += `</ul>`;

        // 2. カテゴリ合計行 (太字で強調)
        categoryHtml += `
            <div style="display: flex; justify-content: flex-end; font-weight: bold; font-size: 1em; padding: 5px 0 10px 0; color: #c0392b; border-bottom: 2px solid #ddd;">
                <span style="margin-right: 10px;">${category} 合計:</span>
                <span style="width: 25%; text-align: right;">${formatJpy(categoryTotals[category].subtotal)}</span>
            </div>
        `;
        
        breakdownElement.innerHTML += categoryHtml;
    }
}

// PDF保存/印刷機能
function printEstimate() {
    window.print();
}


// 見積もり計算のメインロジック
function calculateEstimate(shouldSave = true) {
    // 1. 入力データの取得
    const productName = document.getElementById('productName').value;
    const laborDays = parseFloat(document.getElementById('laborDays').value) || 0;
    const dailyLaborRate = parseFloat(document.getElementById('dailyLaborRate').value) || 0;
    const materialProfitRatePercent = parseFloat(document.getElementById('materialProfitRate').value) || 0;
    const projectProfitRatePercent = parseFloat(document.getElementById('projectProfitRate').value) || 0;

    // 2. 材料費（ベース原価）の計算と材料情報の収集
    let baseMaterialCost = 0;
    const materialsToSave = []; 
    // カテゴリごとの合計を初期化
    const categoryTotals = {}; 
    
    const allMaterialItems = document.querySelectorAll('.material-category .material-item, .material-category .custom-item');
    
    allMaterialItems.forEach(item => {
        const quantity = parseFloat(item.querySelector('.quantity').value) || 0;
        const unitPrice = parseFloat(item.querySelector('.unitPrice').value) || 0; 
        
        // 材料情報を収集
        const categoryElement = item.closest('.material-category').querySelector('div[id$="_化粧材"], div[id$="_下地材"], div[id$="_金物"], div[id$="_外注費"]');
        if (!categoryElement) return;

        const category = categoryElement.id.split('_')[1];
        const itemCost = quantity * unitPrice; // アイテムごとの原価
        
        baseMaterialCost += itemCost; // ベース原価に加算

        // カテゴリ合計を更新
        categoryTotals[category] = (categoryTotals[category] || 0) + itemCost;

        if (item.classList.contains('custom-item')) {
            const name = item.querySelector('.custom-name').value || 'カスタム材料';
            materialsToSave.push({
                category: category,
                name: name,
                spec: 'カスタム',
                quantity: quantity,
                unitPrice: unitPrice,
                isCustom: true
            });
        } else {
            const selectElement = item.querySelector('.name-select select'); 
            
            // selectElementが存在し、かつ値が0でない場合にのみ処理
            if (selectElement && selectElement.value !== '0' && quantity > 0) {
                const parts = selectElement.value.split(';');
                if (parts.length >= 3) { // 安全策: 要素が3つ以上あるか確認
                     const [name, spec] = parts;
                     materialsToSave.push({
                        category: category,
                        name: name,
                        spec: spec,
                        quantity: quantity,
                        unitPrice: unitPrice,
                        isCustom: false
                    });
                } else {
                    console.warn("プルダウン材料の値が不正で保存をスキップしました:", selectElement.value);
                }
            }
        }
    });

    // 3. 利益の二段階計算
    const materialProfitMarkup = materialProfitRatePercent / 100;
    const materialProfitAmount = baseMaterialCost * materialProfitMarkup;
    const materialCostWithProfit = baseMaterialCost + materialProfitAmount;

    const totalLaborCost = laborDays * dailyLaborRate;
    const totalCost = materialCostWithProfit + totalLaborCost;

    const projectProfitMarkup = projectProfitRatePercent / 100;
    const projectProfitAmount = totalCost * projectProfitMarkup;
    
    const finalPriceNoTax = totalCost + projectProfitAmount; // 最終見積価格 (税別)
    const taxRate = 0.10; // 消費税率10%
    const finalPrice = Math.round(finalPriceNoTax * (1 + taxRate)); // 最終見積価格 (税込)

    // 4. 結果の表示
    document.getElementById('outputProductName').textContent = productName;
    document.getElementById('outputLaborDaysValue').textContent = ` ${laborDays.toFixed(1)}`;
    
    // 材料費内訳の表示
    displayMaterialBreakdown(materialsToSave); 

    // カテゴリ別合計の表示 (新規追加)
    const totalsHtml = Object.keys(categoryTotals).map(category => {
        return `
            <div class="result-line category-subtotal" style="font-size: 1em; color: #555; border-bottom: none;">
                <span style="font-weight: 600;">${category} 原価合計:</span>
                <span>${formatJpy(categoryTotals[category])}</span>
            </div>
        `;
    }).join('');
    
    document.getElementById('outputCategoryTotals').innerHTML = totalsHtml;
    // カテゴリ別合計の表示ここまで 

    document.getElementById('outputBaseMaterialCost').textContent = formatJpy(baseMaterialCost);
    document.getElementById('outputMaterialProfitRateValue').textContent = `${materialProfitRatePercent}%`;
    document.getElementById('outputMaterialProfitAmount').textContent = formatJpy(materialProfitAmount);
    document.getElementById('outputMaterialCostWithProfit').textContent = formatJpy(materialCostWithProfit);

    document.getElementById('outputLaborCost').textContent = formatJpy(totalLaborCost);
    document.getElementById('outputTotalCost').textContent = formatJpy(totalCost);
    document.getElementById('outputProjectProfitRateValue').textContent = `${projectProfitRatePercent}%`;
    document.getElementById('outputProjectProfitAmount').textContent = formatJpy(projectProfitAmount);
    
    // 税別価格の表示
    document.getElementById('outputFinalPriceNoTax').textContent = formatJpy(finalPriceNoTax); 

    document.getElementById('outputFinalPrice').textContent = formatJpy(finalPrice);
    
    // 5. 保存
    if (shouldSave) {
        // 保存データに税別価格を追加
        saveEstimate({finalPrice: finalPrice, finalPriceNoTax: finalPriceNoTax, materials: materialsToSave}); 
        alert(`見積もり計算が完了し、履歴に保存されました！\n最終価格: ${formatJpy(finalPrice)} (税別${formatJpy(finalPriceNoTax)})`);
    }
}