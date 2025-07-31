# 📋 可贖回債券評價系統 - 操作標準作業程序 (SOP)

## Standard Operating Procedure - Callable Bond Pricing System

---

## 🌐 語言切換 | Language Switch
[English SOP](#english-sop) | [中文 SOP](#中文-sop)

---

## English SOP

### 🎯 Purpose
This SOP provides step-by-step instructions for using the Callable Bond Pricing Model to accurately value callable bonds using the Hull-White 1-Factor Trinomial Tree methodology.

### 👥 Target Users
- Financial analysts
- Risk managers  
- Portfolio managers
- Academic researchers
- Finance students

### 🛠️ System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for initial load
- No additional software installation required

### 📝 Step-by-Step Operating Procedure

#### **Phase 1: System Access**

**Step 1.1: Access the Application**
1. Open web browser
2. Navigate to: `https://your-username.github.io/callable-bond-pricer/`
3. Wait for page to fully load (should display "可贖回債券評價模型" header)
4. Verify all input sections are visible

**Step 1.2: System Check**
- Confirm all three main sections are displayed:
  - 📄 Bond Data (債券資料)
  - ⚙️ HW1F Model Parameters (HW1F 模型參數)  
  - 📈 Yield Curve (殖利率曲線)

#### **Phase 2: Bond Data Input**

**Step 2.1: Basic Bond Information**
1. **Principal (本金)**
   - Enter face value (typically 100)
   - Format: Numeric value
   - Example: `100`

2. **Market Price (市場價格)**
   - Enter current market trading price
   - Used for OAS calculation
   - Leave blank if OAS calculation not needed
   - Example: `102.5`

3. **Coupon Rate (票面利率)**
   - Enter annual coupon rate as percentage
   - Format: Percentage (without % symbol)
   - Example: `4.5` (for 4.5%)

4. **Maturity (到期年限)**
   - Enter time to maturity in years
   - Format: Decimal years allowed
   - Example: `3` or `2.5`

**Step 2.2: Payment Structure**
1. **Coupon Frequency (付息頻率)**
   - Select from dropdown:
     - `半年一次 (Semi-Annual)` = 2 payments/year
     - `一年一次 (Annual)` = 1 payment/year  
     - `一季一次 (Quarterly)` = 4 payments/year

**Step 2.3: Call Option Details**
1. **Strike Price (贖回價)**
   - Enter call strike price per 100 face value
   - Typically 100 (at par) or slightly above
   - Example: `100` or `102`

2. **Call Structure (贖回結構)**
   - Format: `NC[period][unit]x[frequency][unit]`
   - Units: Y (years), M (months)
   - Examples:
     - `NC1Yx6M` = No-call 1 year, then every 6 months
     - `NC6Mx1M` = No-call 6 months, then monthly
     - `NC2Yx3M` = No-call 2 years, then quarterly

#### **Phase 3: Model Parameters Configuration**

**Step 3.1: Hull-White Parameters**
1. **Mean Reversion (均值回歸, a)**
   - Enter as percentage
   - Typical range: 1% - 10%
   - Higher values = faster mean reversion
   - Example: `3.0`

2. **Volatility (短期利率波動率, σ)**
   - Enter short-rate volatility as percentage
   - Typical range: 0.5% - 3%
   - Market-calibrated values preferred
   - Example: `1.08`

**Step 3.2: Numerical Parameters**
1. **Tree Steps per Year (每年樹的步數)**
   - Recommended: 12 or higher
   - Higher values = more accuracy but slower calculation
   - Range: 4 - 50
   - Example: `12`

2. **Credit Spread (信用利差)**
   - Enter additional spread in basis points
   - Added to risk-free yield curve
   - Example: `50` (for 50 bps)

#### **Phase 4: Yield Curve Input**

**Step 4.1: Market Rates Entry**
Enter current market rates for each tenor as percentages:

| Tenor | Typical Range | Example |
|-------|---------------|---------|
| 3M    | 3% - 6%      | 4.314   |
| 6M    | 3% - 6%      | 4.295   |
| 1Y    | 3% - 6%      | 4.103   |
| 2Y    | 3% - 6%      | 3.954   |
| 3Y    | 3% - 6%      | 3.901   |
| 5Y    | 3% - 6%      | 3.992   |
| 7Y    | 3% - 6%      | 4.391   |
| 10Y   | 3% - 6%      | 4.391   |

**Step 4.2: Curve Validation**
- Ensure rates follow reasonable term structure
- Check for unusual inversions or spikes
- Verify rates are in decimal percentage format

#### **Phase 5: Calculation and Results**

**Step 5.1: Execute Calculation**
1. Review all inputs for accuracy
2. Click **"計算價格"** (Calculate Price) button
3. Wait for calculation completion (typically 1-3 seconds)
4. **"顯示利率樹"** (Display Tree) button will become enabled

**Step 5.2: Results Interpretation**

Review the following outputs:

1. **Option-Free Bond Price (無選擇權債券價格)**
   - Standard discounted cash flow value
   - Should be close to par for at-market bonds

2. **Callable Bond Price (可贖回債券價格)**
   - Price accounting for embedded call option
   - Always ≤ Option-Free Price

3. **Embedded Option Value (隱含選擇權價值)**
   - Cost of the call option to bondholder
   - = Option-Free Price - Callable Price
   - Higher values indicate more valuable call option

4. **Model-Implied Yield (模型隱含殖利率)**
   - IRR based on calculated fair value
   - Compare to market yields

5. **OAS (選擇權調整利差)**
   - Only appears if Market Price was entered
   - Spread over benchmark curve
   - Positive = bond trades rich, Negative = cheap

#### **Phase 6: Tree Visualization (Optional)**

**Step 6.1: Display Interest Rate Tree**
1. Click **"顯示利率樹"** (Display Tree) button
2. Modal window opens with detailed tree visualization
3. Scroll horizontally to view all time steps

**Step 6.2: Tree Analysis**
- **Node Information**: Each node shows:
  - Pure bond price (純債券價格)
  - Callable bond price (可贖回債券價格)  
  - Option value (期權價值)
  - Interest rate (利率)
- **Red Borders**: Indicate early exercise nodes
- **Probabilities**: Up/Middle/Down transition probabilities

### ⚠️ Quality Control Checkpoints

#### **Input Validation**
- [ ] All required fields completed
- [ ] Yield curve rates in ascending time order
- [ ] Call structure format correct
- [ ] Model parameters within reasonable ranges

#### **Results Validation**
- [ ] Callable price ≤ Option-free price
- [ ] Option value ≥ 0
- [ ] Implied yield reasonable vs. market
- [ ] OAS within expected range (-500 to +500 bps typical)

#### **Common Error Resolution**
| Error Scenario | Solution |
|----------------|----------|
| "無效的贖回結構格式" | Check call structure format (NC1Yx6M) |
| Negative option value | Review model parameters |
| Unrealistic prices | Verify yield curve inputs |
| "無法計算" for OAS/Yield | Check if market price entered |

### 📊 Output Documentation

**Step 7.1: Results Recording**
Document the following for audit trail:
- Input parameters used
- Calculation timestamp  
- All output values
- Any assumptions or adjustments made

**Step 7.2: Sensitivity Analysis (Recommended)**
Test key parameter sensitivities:
- Volatility ±20%
- Mean reversion ±50%  
- Yield curve ±25 bps parallel shift

---

## 中文 SOP

### 🎯 目的
本標準作業程序提供使用可贖回債券評價模型的詳細步驟，以 Hull-White 單因子三元樹方法精確評價可贖回債券。

### 👥 目標使用者
- 金融分析師
- 風險管理師
- 投資組合經理
- 學術研究人員
- 金融系學生

### 🛠️ 系統需求
- 現代網頁瀏覽器 (Chrome、Firefox、Safari、Edge)
- 網路連線（僅初次載入需要）
- 無需安裝額外軟體

### 📝 逐步操作程序

#### **階段一：系統存取**

**步驟 1.1：存取應用程式**
1. 開啟網頁瀏覽器
2. 導航至：`https://your-username.github.io/callable-bond-pricer/`
3. 等待頁面完全載入（應顯示「可贖回債券評價模型」標題）
4. 確認所有輸入區段均可見

**步驟 1.2：系統檢查**
- 確認顯示三個主要區段：
  - 📄 債券資料
  - ⚙️ HW1F 模型參數
  - 📈 殖利率曲線

#### **階段二：債券資料輸入**

**步驟 2.1：基本債券資訊**
1. **本金 (Principal)**
   - 輸入面額（通常為 100）
   - 格式：數值
   - 範例：`100`

2. **市場價格 (Market Price)**
   - 輸入目前市場交易價格
   - 用於 OAS 計算
   - 如不需 OAS 計算可留空
   - 範例：`102.5`

3. **票面利率 (Coupon Rate)**
   - 輸入年票面利率（百分比）
   - 格式：百分比（不含 % 符號）
   - 範例：`4.5`（代表 4.5%）

4. **到期年限 (Maturity)**
   - 輸入到期時間（年）
   - 格式：可使用小數
   - 範例：`3` 或 `2.5`

**步驟 2.2：付息結構**
1. **付息頻率 (Coupon Frequency)**
   - 從下拉選單選擇：
     - `半年一次 (Semi-Annual)` = 每年 2 次
     - `一年一次 (Annual)` = 每年 1 次
     - `一季一次 (Quarterly)` = 每年 4 次

**步驟 2.3：贖回選擇權詳情**
1. **贖回價 (Strike Price)**
   - 輸入每 100 面額的贖回履約價
   - 通常為 100（平價）或略高
   - 範例：`100` 或 `102`

2. **贖回結構 (Call Structure)**
   - 格式：`NC[期間][單位]x[頻率][單位]`
   - 單位：Y（年）、M（月）
   - 範例：
     - `NC1Yx6M` = 1年不可贖回，之後每6個月可贖回
     - `NC6Mx1M` = 6個月不可贖回，之後每月可贖回
     - `NC2Yx3M` = 2年不可贖回，之後每季可贖回

#### **階段三：模型參數設定**

**步驟 3.1：Hull-White 參數**
1. **均值回歸 (Mean Reversion, a)**
   - 以百分比輸入
   - 典型範圍：1% - 10%
   - 數值越高 = 均值回歸越快
   - 範例：`3.0`

2. **波動率 (Volatility, σ)**
   - 輸入短期利率波動率（百分比）
   - 典型範圍：0.5% - 3%
   - 建議使用市場校準值
   - 範例：`1.08`

**步驟 3.2：數值參數**
1. **每年樹的步數 (Tree Steps per Year)**
   - 建議：12 或更高
   - 數值越高 = 精確度越高但計算越慢
   - 範圍：4 - 50
   - 範例：`12`

2. **信用利差 (Credit Spread)**
   - 輸入額外利差（基點）
   - 加在無風險殖利率曲線上
   - 範例：`50`（代表 50 基點）

#### **階段四：殖利率曲線輸入**

**步驟 4.1：市場利率輸入**
為各期限輸入當前市場利率（百分比）：

| 期限 | 典型範圍 | 範例  |
|------|----------|-------|
| 3M   | 3% - 6%  | 4.314 |
| 6M   | 3% - 6%  | 4.295 |
| 1Y   | 3% - 6%  | 4.103 |
| 2Y   | 3% - 6%  | 3.954 |
| 3Y   | 3% - 6%  | 3.901 |
| 5Y   | 3% - 6%  | 3.992 |
| 7Y   | 3% - 6%  | 4.391 |
| 10Y  | 3% - 6%  | 4.391 |

**步驟 4.2：曲線驗證**
- 確認利率遵循合理的期限結構
- 檢查異常的倒掛或突增
- 驗證利率為小數百分比格式

#### **階段五：計算與結果**

**步驟 5.1：執行計算**
1. 檢查所有輸入的準確性
2. 點擊 **"計算價格"** 按鈕
3. 等待計算完成（通常 1-3 秒）
4. **"顯示利率樹"** 按鈕將會啟用

**步驟 5.2：結果解讀**

檢視以下輸出：

1. **無選擇權債券價格**
   - 標準折現現金流價值
   - 對於市價債券應接近面額

2. **可贖回債券價格**
   - 考慮嵌入式贖回選擇權的價格
   - 恆小於等於無選擇權價格

3. **隱含選擇權價值**
   - 債券持有人承擔的贖回選擇權成本
   - = 無選擇權價格 - 可贖回價格
   - 數值越高表示贖回選擇權越有價值

4. **模型隱含殖利率**
   - 基於計算公允價值的內部報酬率
   - 與市場殖利率比較

5. **OAS (選擇權調整利差)**
   - 僅在輸入市場價格時顯示
   - 相對於基準曲線的利差
   - 正值 = 債券交易偏貴，負值 = 偏便宜

#### **階段六：樹狀視覺化（選擇性）**

**步驟 6.1：顯示利率樹**
1. 點擊 **"顯示利率樹"** 按鈕
2. 開啟包含詳細樹狀視覺化的彈出視窗
3. 水平滾動查看所有時間步

**步驟 6.2：樹狀分析**
- **節點資訊**：每個節點顯示：
  - 純債券價格
  - 可贖回債券價格
  - 期權價值
  - 利率
- **紅色邊框**：表示提前贖回節點
- **機率**：上/中/下分支轉移機率

### ⚠️ 品質控制檢查點

#### **輸入驗證**
- [ ] 所有必填欄位完成
- [ ] 殖利率曲線利率按時間順序遞增
- [ ] 贖回結構格式正確
- [ ] 模型參數在合理範圍內

#### **結果驗證**
- [ ] 可贖回價格 ≤ 無選擇權價格
- [ ] 選擇權價值 ≥ 0
- [ ] 隱含殖利率相對於市場合理
- [ ] OAS 在預期範圍內（典型為 -500 至 +500 基點）

#### **常見錯誤解決**
| 錯誤情況 | 解決方案 |
|----------|----------|
| "無效的贖回結構格式" | 檢查贖回結構格式 (NC1Yx6M) |
| 負選擇權價值 | 檢視模型參數 |
| 不現實的價格 | 驗證殖利率曲線輸入 |
| OAS/殖利率顯示"無法計算" | 檢查是否輸入市場價格 |

### 📊 輸出文件化

**步驟 7.1：結果記錄**
為審計軌跡記錄以下項目：
- 使用的輸入參數
- 計算時間戳
- 所有輸出值
- 任何假設或調整

**步驟 7.2：敏感度分析（建議）**
測試關鍵參數敏感度：
- 波動率 ±20%
- 均值回歸 ±50%
- 殖利率曲線 ±25 基點平行移動

### 🔍 故障排除指南

#### **常見問題與解決方案**

**問題 1：頁面無法載入**
- 解決方案：
  - 檢查網路連線
  - 清除瀏覽器快取
  - 嘗試不同瀏覽器
  - 確認 URL 正確

**問題 2：計算結果不合理**
- 可能原因：
  - 殖利率曲線輸入錯誤
  - 模型參數超出合理範圍
  - 債券參數設定錯誤
- 解決方案：
  - 檢查所有輸入值
  - 對照市場數據
  - 使用預設值重新測試

**問題 3：樹狀圖顯示異常**
- 可能原因：
  - 樹狀步數設定過低
  - 波動率參數過高
  - 均值回歸參數極端
- 解決方案：
  - 增加每年樹狀步數至 12+
  - 調整波動率至 0.5%-3% 範圍
  - 調整均值回歸至 1%-10% 範圍

**問題 4：OAS 計算失敗**
- 可能原因：
  - 未輸入市場價格
  - 市場價格與模型價格差異過大
- 解決方案：
  - 確認輸入市場價格
  - 檢查市場價格合理性
  - 調整模型參數使模型價格接近市場價格

### 📋 檢查清單範本

#### **計算前檢查清單**
```
債券基本資料：
□ 本金：_______
□ 市場價格：_______
□ 票面利率：_______%
□ 到期年限：_______年
□ 付息頻率：_______
□ 贖回價：_______
□ 贖回結構：_______

模型參數：
□ 均值回歸：_______%
□ 波動率：_______%
□ 樹狀步數：_______
□ 信用利差：_______基點

殖利率曲線：
□ 3M：_______%   □ 6M：_______%
□ 1Y：_______%   □ 2Y：_______%
□ 3Y：_______%   □ 5Y：_______%
□ 7Y：_______%   □ 10Y：_______%
```

#### **計算後檢查清單**
```
結果合理性檢查：
□ 無選擇權債券價格：_______
□ 可贖回債券價格：_______
□ 選擇權價值 ≥ 0：_______
□ 隱含殖利率：_______%
□ OAS（如適用）：_______基點

品質確認：
□ 可贖回價格 ≤ 無選擇權價格
□ 結果與市場預期一致
□ 進行敏感度分析
□ 記錄計算假設
```

### 📚 參考資料與延伸閱讀

#### **理論基礎**
- Hull, J. & White, A. (1990). "Pricing Interest-Rate-Derivative Securities"
- Hull, J. (2017). "Options, Futures, and Other Derivatives"
- Brigo, D. & Mercurio, F. (2006). "Interest Rate Models"

#### **實務應用**
- Fixed Income Securities Valuation
- Credit Risk Assessment
- Portfolio Risk Management
- Regulatory Capital Calculation

#### **進階主題**
- 多因子利率模型
- 蒙地卡羅模擬定價
- 美式選擇權數值方法
- 模型校準技術

### 🎯 訓練與認證

#### **建議訓練流程**
1. **基礎理論學習**（4小時）
   - Hull-White 模型原理
   - 三元樹建構方法
   - 可贖回債券機制

2. **系統操作訓練**（2小時）
   - 介面操作練習
   - 參數設定指導
   - 結果解讀說明

3. **案例研究**（2小時）
   - 實際債券評價案例
   - 敏感度分析練習
   - 錯誤處理演練

4. **認證測試**（1小時）
   - 理論知識測驗
   - 實作操作考核
   - 結果分析評估

#### **持續改進**
- 定期檢視 SOP 有效性
- 收集使用者回饋
- 更新最佳實務
- 增強系統功能

---

### 📞 技術支援

**如需協助，請聯繫：**
- 📧 Email: support@bondpricer.com
- 📱 GitHub Issues: [報告問題](https://github.com/your-username/callable-bond-pricer/issues)
- 📖 文檔: [完整文檔](https://github.com/your-username/callable-bond-pricer/wiki)

**回應時間：**
- 緊急問題：4小時內
- 一般詢問：24小時內
- 功能建議：72小時內

---

<div align="center">

**版本資訊**
- SOP 版本：v1.0
- 最後更新：2025年1月
- 下次檢視：2025年7月

**🔄 本 SOP 將持續更新以確保最佳實務**

</div>
