// A small tolerance for floating point comparisons
const EPSILON = 1e-9;
 
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const calculateBtn = document.getElementById('calculateBtn');
    const displayTreeBtn = document.getElementById('displayTreeBtn');
    const modal = document.getElementById('treeModal');
    const closeModalBtn = document.querySelector('.close-btn');
 
    // --- Global variable to store calculation results ---
    let calculationResult = null;
 
    // --- Event Listeners ---
    calculateBtn.addEventListener('click', runCalculation);
    displayTreeBtn.addEventListener('click', () => {
        if (calculationResult && calculationResult.tree) {
            displayTree(calculationResult);
            modal.style.display = 'block';
        }
    });
    closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
 
    /**
     * Main Calculation Orchestrator
     * 主計算協調器
     */
    function runCalculation() {
        try {
            const inputs = getInputs();
            if (!inputs) return;
 
            // 1. Calculate Option-Free Bond Price (standard discounting)
            // 1. 計算無期權債券價格（標準折現）
            const optionFreePrice = calculateOptionFreePrice(inputs);
 
            // 2. Price Callable Bond using the full Hull-White Tree Implementation
            // This price is the "fair value" with the user-provided spread.
            // 2. 使用完整的 Hull-White 樹實作來為可贖回債券定價
            // 此價格是使用者提供利差後的「公允價值」。
            calculationResult = priceCallableBondHW(inputs);
                                             //console.log(`${calculationResult.price.toFixed(8)}`);
            // 3. Calculate OAS if market price is provided
            // 3. 如果提供了市場價格，則計算 OAS
            let oas = null;
            if (inputs.marketPrice && inputs.marketPrice > 0) {
                 oas = calculateOAS(inputs);
            }
 
            // 4. Calculate Model-Implied Yield from the fair value
            // 4. 從公允價值計算模型隱含收益率
            const impliedYield = calculateImpliedYield(calculationResult.price, inputs);
 
            // 5. Display all results
            // 5. 顯示所有結果
            displayResults({
                optionFreePrice: optionFreePrice,
                callableBondPrice: calculationResult.price,
                oas: oas,
                impliedYield: impliedYield
            });
 
            // 6. Enable the "Display Tree" button
            // 6. 啟用「顯示樹狀圖」按鈕
            displayTreeBtn.disabled = false;
        } catch (error) {
            // 使用自定義訊息框替代 alert
            showCustomAlert(`計算時發生錯誤: ${error.message}`);
            console.error(error);
        }
    }
 
    /**
     * Gathers and validates all user inputs from the form.
     * 從表單收集並驗證所有使用者輸入。
     */
    function getInputs() {
        // Parsing form values
        const principal = parseFloat(document.getElementById('principal').value);
        const marketPrice = parseFloat(document.getElementById('marketPrice').value);
        const couponRate = parseFloat(document.getElementById('couponRate').value) / 100;
        const maturity = parseFloat(document.getElementById('maturity').value);
        const couponFreq = parseInt(document.getElementById('couponFreq').value);
        const strikePrice = parseFloat(document.getElementById('strikePrice').value);
        const callStructure = document.getElementById('callStructure').value;
 
        const meanReversion = parseFloat(document.getElementById('meanReversion').value) / 100;
        const volatility = parseFloat(document.getElementById('volatility').value) / 100;
        const stepsPerYear = parseInt(document.getElementById('treeSteps').value);
        const spreadBps = parseFloat(document.getElementById('spread').value);
 
        // Parse yield curve
        const yieldCurve = [];
        document.querySelectorAll('.yc-input').forEach(input => {
            const time = parseFloat(input.dataset.tenor);
            const rate = parseFloat(input.value) / 100;
            if (!isNaN(time) && !isNaN(rate)) {
                yieldCurve.push({ time, rate });
            }
        });
        yieldCurve.sort((a,b) => a.time - b.time);
 
        // Parse call structure
        const callParts = callStructure.toUpperCase().match(/NC([\d.]+)(\w)X([\d.]+)(\w)/);
        if (!callParts) {
            // 使用自定義訊息框替代 alert
            showCustomAlert("無效的贖回結構格式。請使用類似 NC1Yx1Y 或 NC6Mx3M 的格式。");
            return null;
        }
        const timeUnitToYears = (val, unit) => (unit === 'Y' ? val : val / 12);
        const noCallPeriod = timeUnitToYears(parseFloat(callParts[1]), callParts[2]);
        const callFrequency = timeUnitToYears(parseFloat(callParts[3]), callParts[4]);
 
        return {
            principal, marketPrice, couponRate, maturity, couponFreq, strikePrice,
            callInfo: { noCallPeriod, callFrequency },
            model: { meanReversion, volatility, stepsPerYear },
            yieldCurve, spreadBps
        };
    }
 
    /**
     * Generic root-finding solver using the Secant Method.
     * 使用割線法尋找根的通用解算器。
     * @param {function} func The function for which to find the root, f(x) = 0.
     * @param {number} x0 First initial guess. 第一次初始猜測。
     * @param {number} x1 Second initial guess. 第二次初始猜測。
     * @param {number} tolerance The desired precision. 所需的精度。
     * @param {number} maxIter Maximum number of iterations. 最大迭代次數。
     * @returns {number|null} The root, or null if not found. 根，如果找不到則為 null。
     */
    function secantSolver(func, x0, x1, tolerance = 1e-7, maxIter = 100) {
        let f0 = func(x0);
        let f1 = func(x1);
        for (let i = 0; i < maxIter; i++) {
            if (Math.abs(f1) < tolerance) return x1;
            if (Math.abs(f1 - f0) < EPSILON) return null; // Avoid division by zero 避免除以零
 
            const x2 = x1 - f1 * (x1 - x0) / (f1 - f0);
            x0 = x1;
            f0 = f1;
            x1 = x2;
            f1 = func(x1);
        }
        return null; // Failed to converge 未能收斂
    }
 
    /**
     * Calculates the Option-Adjusted Spread (OAS).
     * 計算期權調整利差 (OAS)。
     * @param {object} inputs The user inputs, including marketPrice. 使用者輸入，包括市場價格。
     * @returns {number|string} The OAS in basis points, or an error message. OAS（基點），或錯誤訊息。
     */
    function calculateOAS(inputs) {
        const { marketPrice } = inputs;
 
        // The function whose root we want to find.
        // It's the difference between the model price (with a given spread) and the market price.
        // 我們要尋找其根的函數。
        // 它是模型價格（具有給定利差）與市場價格之間的差異。
        const errorFunc = (spreadInBps) => {
            // Create a copy of inputs and set the new spread
            // 建立輸入的副本並設定新的利差
            const pricingInputs = { ...inputs, spreadBps: spreadInBps };
            const modelPrice = priceCallableBondHW(pricingInputs).price;
            return modelPrice - marketPrice;
        };
 
        // Solve for the spread in bps that makes the error zero.
        // 求解使誤差為零的基點利差。
        const oas = secantSolver(errorFunc, -50, 50); // Initial guesses: 0 bps and 50 bps 初始猜測：0 基點和 50 基點
        return oas !== null ? oas : "無法計算"; // Return in basis points 以基點回傳
    }
 
    /**
     * Calculates the bond price for a given flat yield (YTM).
     * 計算給定平坦收益率 (YTM) 的債券價格。
     * @param {number} yieldRate The flat yield for discounting. 用於折現的平坦收益率。
     * @param {object} inputs The bond parameters. 債券參數。
     * @returns {number} The calculated price. 計算出的價格。
     */
    function priceWithFlatYield(yieldRate, inputs) {
        let price = 0;
        const { principal, couponRate, maturity, couponFreq } = inputs;
        const couponPayment = principal * couponRate / couponFreq;
        const numCoupons = maturity * couponFreq;
 
        for (let i = 1; i <= numCoupons; i++) {
            const timeToCoupon = i / couponFreq;
            price += couponPayment / Math.pow(1 + yieldRate / couponFreq, i);
        }
        price += principal / Math.pow(1 + yieldRate / couponFreq, numCoupons);
        return price;
    }
 
    /**
     * Calculates the Model-Implied Yield (IRR).
     * 計算模型隱含收益率 (IRR)。
     * @param {number} fairValue The model-calculated fair price of the bond. 模型計算出的債券公允價格。
     * @param {object} inputs The bond parameters. 債券參數。
     * @returns {number|string} The implied yield in percent, or an error message. 隱含收益率（百分比），或錯誤訊息。
     */
    function calculateImpliedYield(fairValue, inputs) {
         const errorFunc = (yieldRate) => {
            return priceWithFlatYield(yieldRate, inputs) - fairValue;
        };
 
        // Solve for the yield that makes the standard price equal to the model's fair value.
        // 求解使標準價格等於模型公允價值的收益率。
        const yieldResult = secantSolver(errorFunc, 0.05, 0.04); // Initial guesses: 5% and 4% yield 初始猜測：5% 和 4% 收益率
        return yieldResult !== null ? yieldResult * 100 : "無法計算";
    }
 
 
    /**
     * Calculates the price of a simple, non-callable bond by discounting cash flows.
     * 通過折現現金流量計算簡單、不可贖回債券的價格。
     */
    function calculateOptionFreePrice(inputs) {
        let price = 0;
        const { principal, couponRate, maturity, couponFreq, yieldCurve, spreadBps } = inputs;
        const couponPayment = principal * couponRate / couponFreq;
        const numCoupons = maturity * couponFreq;
        const spread = spreadBps / 10000;
 
        for (let i = 1; i <= numCoupons; i++) {
            const timeToCoupon = i / couponFreq;
            const rate = interpolateYield(timeToCoupon, yieldCurve) + spread;
            price += couponPayment * Math.exp(-rate * timeToCoupon);
        }
 
        const timeToMaturity = maturity;
        const finalRate = interpolateYield(timeToMaturity, yieldCurve) + spread;
        price += principal * Math.exp(-finalRate * timeToMaturity);
 
        return price;
    }
 
    /**
     * Performs linear interpolation on the yield curve.
     * 對收益率曲線執行線性插值。
     */
    function interpolateYield(time, yieldCurve) {
        if (time <= yieldCurve[0].time) return yieldCurve[0].rate;
        if (time >= yieldCurve[yieldCurve.length - 1].time) return yieldCurve[yieldCurve.length - 1].rate;
 
        let p1 = yieldCurve[0], p2 = yieldCurve[yieldCurve.length - 1];
        for (let i = 0; i < yieldCurve.length - 1; i++) {
            if (yieldCurve[i].time <= time && yieldCurve[i+1].time >= time) {
                p1 = yieldCurve[i];
                p2 = yieldCurve[i+1];
                break;
            }
        }
        if (p1.time === p2.time) return p1.rate;
 
        return p1.rate + (p2.rate - p1.rate) * (time - p1.time) / (p2.time - p1.time);
    }
 
    /**
     * Calculates the accrued interest for a bond at a given time.
     * 計算債券在給定時間的應計利息。
     * Assumes actual/actual day count basis within coupon period.
     * @param {number} timeCurrent The current time in years from issuance. 從發行開始的當前時間（年）。
     * @param {number} couponRate The annual coupon rate as a decimal. 年息票利率（小數）。
     * @param {number} principal The bond's principal (face value). 債券本金（面值）。
     * @param {number} couponFreq The number of coupon payments per year. 每年付息次數。
     * @param {number} maturity The bond's maturity in years from issuance. 從發行開始的債券期限（年）。
     * @returns {number} The accrued interest. 應計利息。
     */
    function calculateAccruedInterest(timeCurrent, couponRate, principal, couponFreq, maturity) {
        const periodLength = 1 / couponFreq; // Length of one coupon period in years 一個付息期的長度（年）
        const numPeriods = maturity * couponFreq; // Total number of coupon periods 總付息期數
 
        let lastCouponTime = 0;
        let nextCouponTime = 0;
 
        // Find the last and next coupon payment times
        // 找到上一個和下一個付息時間
        for (let i = 1; i <= numPeriods; i++) {
            const currentCouponTime = i * periodLength;
            if (timeCurrent < currentCouponTime - EPSILON) { // current time is before this coupon current time 在此付息時間之前
                nextCouponTime = currentCouponTime;
                lastCouponTime = (i - 1) * periodLength;
                break;
            } else if (Math.abs(timeCurrent - currentCouponTime) < EPSILON) { // current time is exactly a coupon date 當前時間恰好是付息日
                // If it's a coupon date, accrued interest is 0 right after payment
                // 如果是付息日，應計利息在付款後為 0
                return 0;
            }
        }
 
        // If no next coupon time found for a time before maturity (e.g. for time=0)
        // If timeCurrent is 0, lastCouponTime should be 0.
        if (timeCurrent < EPSILON) {
            lastCouponTime = 0;
            nextCouponTime = periodLength;
        } else if (nextCouponTime === 0) { // Means timeCurrent is after the last coupon but before or at maturity
            nextCouponTime = maturity; // The principal repayment is the "next payment"
            lastCouponTime = (numPeriods - 1) * periodLength; // The last coupon payment date
        }
 
        const daysInPeriod = periodLength * 365; // Approx days in a coupon period 付息期的大約天數
        const daysSinceLastCoupon = (timeCurrent - lastCouponTime) * 365; // Days passed since last coupon time 自上次付息時間以來的天數
 
        if (daysInPeriod < EPSILON) return 0; // Avoid division by zero 避免除以零
 
        const accruedFraction = daysSinceLastCoupon / daysInPeriod;
        return accruedFraction * (principal * couponRate / couponFreq);
    }
 
 
    /**
     * Main function to price the callable bond using a fully implemented HW1F Tree.
     * 使用完整實作的 HW1F 樹為可贖回債券定價的主要函數。
     */
    function priceCallableBondHW(inputs) {
        const { maturity, model, yieldCurve, spreadBps, couponRate, principal, couponFreq, callInfo, strikePrice } = inputs;
        const { meanReversion: a, volatility: sigma, stepsPerYear } = model;
        const spread = spreadBps / 10000;
 
        const adjustedYieldCurve = yieldCurve.map(p => ({ time: p.time, rate: p.rate + spread }));
 
        const dt = 1 / stepsPerYear;
        const totalSteps = Math.round(maturity * stepsPerYear);
        const timeSteps = Array.from({ length: totalSteps + 1 }, (_, i) => i * dt);
 
        // Initialize tree structure with nodes
        // 初始化樹狀結構與節點
        const tree = timeSteps.map(t => ({ t, dt, nodes: [] }));
 
        // dx is constant for constant dt
        // dx 對於常數 dt 來說是常數
        const dx = sigma * Math.sqrt(3 * dt);
 
        // --- 2. Build Tree Geometry and Probabilities (TreeAdvance) ---
        // --- 2. 建立樹狀幾何與機率 (TreeAdvance) ---
        // Root node at time 0
        // 時間 0 的根節點
        tree[0].nodes.push({ j: 0, Q: 1, k: 0, pu: 0, pm: 0, pd: 0, alpha: 0, rate: 0 });
        //console.log(`\n--- Tree Construction (Q Propagation) ---`);
        //console.log(`Step 0 (Root) nodes: ${tree[0].nodes.length}`);
 
        for (let i = 0; i < totalSteps; i++) {
            const dt_current = tree[i].dt;
            const dx_for_current_step = dx;
            const dx_for_next_step = dx;
 
            let min_k_for_next_step = Infinity;
            let max_k_for_next_step = -Infinity;
 
            tree[i].nodes.forEach(node => {
                if (node.Q === undefined || node.Q === null) {
                    node.Q = 0;
                }
 
                const x_current = node.j * dx_for_current_step;
                // VBA uses linear approximation for xx_expected_next_x: x * (1 - a * dt)
                // VBA 使用 xx_expected_next_x 的線性近似：x * (1 - a * dt)
                const xx_expected_next_x = x_current * (1 - a * dt_current);
 
                let k_float = xx_expected_next_x / dx_for_next_step;
                let k = Math.round(k_float);
 
                // Add VBA's k adjustment logic for boundary nodes if needed for exact match
                // If needed, this logic from VBA's TreeAdvance could be incorporated:
                // If (j = numbnode - 1) Then kval = kval - 1 ... and other adjustments
                // For now, relying on robust probability clamping to handle negative probs and simple rounding.
                // 如果需要精確匹配，則添加 VBA 的 k 調整邏輯以用於邊界節點
                // (注意：這種特定的 VBA k 調整邏輯可能很難精確複製，或者根據初始條件可能不需要)
                // 目前依賴於穩健的機率鉗位來處理負機率和簡單的捨入。
 
                let rmuast = xx_expected_next_x - k * dx_for_next_step;
 
                // VBA's variance is simply sigma^2 * dt in TreeAdvance
                // VBA 在 TreeAdvance 中的方差僅為 sigma^2 * dt
                const variance = sigma * sigma * dt_current;
 
                let pu_raw = (variance + rmuast * rmuast + rmuast * dx_for_next_step) / (2 * dx_for_next_step * dx_for_next_step);
                let pd_raw = (variance + rmuast * rmuast - rmuast * dx_for_next_step) / (2 * dx_for_next_step * dx_for_next_step);
                let pm_raw = 1 - pu_raw - pd_raw;
 
                let attempts = 0;
                const maxAttempts = 5;
 
                while ( (pu_raw < -EPSILON || pd_raw < -EPSILON || pm_raw < -EPSILON || Math.abs(pu_raw + pm_raw + pd_raw - 1) > EPSILON) && attempts < maxAttempts) {
                    if (pu_raw < -EPSILON) { k++; }
                    else if (pd_raw < -EPSILON) { k--; }
                    else if (pm_raw < -EPSILON) {
                        if (k_float > k) k++; else k--;
                    } else {
                        if (k_float > k) k++; else k--;
                    }
 
                    rmuast = xx_expected_next_x - k * dx_for_next_step;
 
                    pu_raw = (variance + rmuast * rmuast + rmuast * dx_for_next_step) / (2 * dx_for_next_step * dx_for_next_step);
                    pd_raw = (variance + rmuast * rmuast - rmuast * dx_for_next_step) / (2 * dx_for_next_step * dx_for_next_step);
                    pm_raw = 1 - pu_raw - pd_raw;
                    attempts++;
                }
 
                let pu = Math.max(0, pu_raw);
                let pd = Math.max(0, pd_raw);
                let pm = Math.max(0, pm_raw);
 
                const sum_probs = pu + pm + pd;
                if (Math.abs(sum_probs - 1) > EPSILON) {
                    pu /= sum_probs;
                    pm /= sum_probs;
                    pd /= sum_probs;
                }
 
                node.k = k;
                node.pu = pu;
                node.pm = pm;
                node.pd = pd;
 
                min_k_for_next_step = Math.min(min_k_for_next_step, k - 1);
                max_k_for_next_step = Math.max(max_k_for_next_step, k + 1);
            });
 
            if (i < totalSteps) {
                let minJ_next = min_k_for_next_step;
                let maxJ_next = max_k_for_next_step;
 
                if (i === 0) {
                    minJ_next = -1;
                    maxJ_next = 1;
                }
 
                tree[i+1].nodes = [];
 
                for (let j = minJ_next; j <= maxJ_next; j++) {
                    tree[i+1].nodes.push({ j: j, Q: 0 });
                }
                //console.log(`Step ${i + 1} nodes: ${tree[i+1].nodes.length}`);
            }
 
            tree[i].nodes.forEach(node => {
                const r_at_node = node.j * dx_for_current_step + (node.alpha || 0);
                const q_propagate = node.Q * Math.exp(-r_at_node * dt_current);
 
                const {k, pu, pm, pd} = node;
 
                const upNode = tree[i+1].nodes.find(n => n.j === k + 1);
                const midNode = tree[i+1].nodes.find(n => n.j === k);
                const downNode = tree[i+1].nodes.find(n => n.j === k - 1);
 
                if (upNode) upNode.Q += pu * q_propagate;
                if (midNode) midNode.Q += pm * q_propagate;
                if (downNode) downNode.Q += pd * q_propagate;
            });
            //console.log(`Step ${i} Q values after propagation:`);
            //tree[i+1].nodes.forEach(node => console.log(`  j=${node.j}, Q=${node.Q.toFixed(8)}`));
        }
 
        // --- 3. Calibrate Tree to Term Structure (TreeAdjust) ---
        // --- 3. 校準樹以適應期限結構 (TreeAdjust) ---
        let lastAlpha = 0;
        if (totalSteps > 0 && timeSteps[1] !== undefined) {
             lastAlpha = interpolateYield(timeSteps[1], adjustedYieldCurve);
             //console.log(`\nInitial alpha guess for Step 0 calibration (from T=dt yield): ${lastAlpha.toFixed(8)}`);
        }
 
        for (let i = 0; i < totalSteps; i++) {
            const targetTime = timeSteps[i+1];
            const targetRate = interpolateYield(targetTime, adjustedYieldCurve);
            const targetDiscount = Math.exp(-targetRate * targetTime);
 
            let alpha = lastAlpha;
            let converged = false;
            let currentAlphaError = 0;
            let iterCount = 0;
 
            //console.log(`\n--- Calibrating Step ${i} ---`);
            //console.log(`Target Time (T): ${targetTime.toFixed(4)} years, Target DF: ${targetDiscount.toFixed(8)}`);
 
            for (iterCount = 0; iterCount < 200; iterCount++) {
                let sum_Q_discounted = 0;
                let derivative_sum_Q_discounted = 0;
 
                const activeNodes = tree[i].nodes.filter(n => Math.abs(n.Q) > EPSILON);
 
                if (activeNodes.length === 0 && i > 0) {
                    //console.warn(`No active nodes at step ${i} for calibration. Skipping calibration for this step.`);
                    converged = true;
                    break;
                }
 
                activeNodes.forEach(node => {
                    const r = node.j * dx + alpha;
                    const discountedQ = node.Q * Math.exp(-r * dt);
                    sum_Q_discounted += discountedQ;
                    derivative_sum_Q_discounted -= dt * discountedQ;
                });
 
                currentAlphaError = sum_Q_discounted - targetDiscount;
                if (Math.abs(currentAlphaError) < 1e-10) {
                    converged = true;
                    break;
                }
                if (Math.abs(derivative_sum_Q_discounted) < EPSILON) {
                    //console.warn(`Derivative too small at Step ${i}, Iter ${iterCount}. Cannot converge further. Error: ${currentAlphaError.toFixed(10)}`);
                    converged = false;
                    break;
                }
                alpha -= currentAlphaError / derivative_sum_Q_discounted;
                //console.log(`  Iter ${iterCount}: Alpha = ${alpha.toFixed(8)}, Current Q_sum_DF = ${sum_Q_discounted.toFixed(8)}, Error = ${currentAlphaError.toExponential(2)}`);
            }
 
            if (!converged) {
                //console.error(`Calibration FAILED for Step ${i}. Final alpha: ${alpha.toFixed(8)}, Final error: ${currentAlphaError.toFixed(10)}`);
            } else {
                //console.log(`Calibration SUCCESS for Step ${i}. Final alpha: ${alpha.toFixed(8)}, Iterations: ${iterCount + 1}`);
            }
 
            tree[i].nodes.forEach(node => node.alpha = alpha);
            lastAlpha = alpha;
 
            if (i < totalSteps) {
                tree[i+1].nodes.forEach(node => node.Q = 0);
 
                tree[i].nodes.forEach(node => {
                    const r_at_node = node.j * dx + node.alpha;
                    const q_propagate = node.Q * Math.exp(-r_at_node * dt);
 
                    const {k, pu, pm, pd} = node;
 
                    const upNode = tree[i+1].nodes.find(n => n.j === k + 1);
                    const midNode = tree[i+1].nodes.find(n => n.j === k);
                    const downNode = tree[i+1].nodes.find(n => n.j === k - 1);
 
                    if (upNode) upNode.Q += pu * q_propagate;
                    if (midNode) midNode.Q += pm * q_propagate;
                    if (downNode) downNode.Q += pd * q_propagate;
                });
                //console.log(`Step ${i+1} Q values after RE-PROPAGATION with calibrated alpha:`);
                //tree[i+1].nodes.forEach(node => console.log(`  j=${node.j}, Q=${node.Q.toFixed(8)}`));
            }
        }
 
        // --- 4. Backward Induction for Callable Bond Pricing (TreeBondOption) ---
        // --- 4. 可贖回債券定價的後向歸納 (TreeBondOption) ---
        const couponPayment = principal * couponRate / couponFreq;
 
        const noCallSteps = Math.round(callInfo.noCallPeriod / dt);
        const callFreqSteps = Math.round(callInfo.callFrequency / dt);
 
        //console.log(`\n--- Backward Induction (Pricing) ---`);
        for (let i = totalSteps; i >= 0; i--) {
            const time = timeSteps[i];
            const isCouponDate = (time > EPSILON && Math.abs(time * couponFreq - Math.round(time * couponFreq)) < EPSILON);
 
            let isCallable = false;
            // Option cannot be exercised at maturity (last step)
            if (i < totalSteps) {
                // Ensure time is beyond no-call period
                if (time >= callInfo.noCallPeriod - EPSILON) {
                    // Check if current time point is a valid call frequency interval from no-call start
                    // Using a more robust floating-point multiple check
                    if (callInfo.callFrequency < EPSILON) { // Handle case where call frequency is effectively zero
                        isCallable = true;
                    } else {
                        const timeSinceNoCall = time - callInfo.noCallPeriod;
                        const numberOfCallFreqIntervals = timeSinceNoCall / callInfo.callFrequency;
 
                        // Check if numberOfCallFreqIntervals is very close to an integer
                        // This handles floating point inaccuracies better than direct modulo for non-exact dt/freq relationships
                        if (Math.abs(numberOfCallFreqIntervals - Math.round(numberOfCallFreqIntervals)) < EPSILON * 100) { // Slightly larger epsilon for this check
                            isCallable = true;
                        }
                    }
                }
            }
            //console.log(`\nProcessing Step ${i} (Time=${time.toFixed(4)}): isCouponDate=${isCouponDate}, isCallable=${isCallable}`);
 
            tree[i].nodes.forEach(node => {
                let pureBondContinuationValue;
                let callableContinuationValue;
 
                if (i === totalSteps) {
                    pureBondContinuationValue = principal + (isCouponDate ? couponPayment : 0);
                    callableContinuationValue = principal + (isCouponDate ? couponPayment : 0);
 
                } else {
                    const upNode = tree[i+1].nodes.find(n => n.j === node.k + 1);
                    const midNode = tree[i+1].nodes.find(n => n.j === node.k);
                    const downNode = tree[i+1].nodes.find(n => n.j === node.k - 1);
 
                    if (!upNode || !midNode || !downNode) {
                        //console.error(`Error: Missing child nodes for parent j=${node.j} at step ${i}. This indicates a tree construction issue.`);
                    }
 
                    const r = node.j * dx + node.alpha;
 
                    const expectedPureBondPriceNext = (node.pu * (upNode?.pureBondPrice ?? 0)) +
                                                      (node.pm * (midNode?.pureBondPrice ?? 0)) +
                                                      (node.pd * (downNode?.pureBondPrice ?? 0));
                    pureBondContinuationValue = expectedPureBondPriceNext * Math.exp(-r * dt);
 
                    if (isCouponDate) {
                        pureBondContinuationValue += couponPayment;
                    }
 
                    const expectedCallablePriceNext = (node.pu * (upNode?.callablePrice ?? 0)) +
                                                      (node.pm * (midNode?.callablePrice ?? 0)) +
                                                      (node.pd * (downNode?.callablePrice ?? 0));
                    callableContinuationValue = expectedCallablePriceNext * Math.exp(-r * dt);
                    if (isCouponDate) {
                        callableContinuationValue += couponPayment;
                    }
                }
 
                node.pureBondPrice = pureBondContinuationValue;
 
                node.exercised = false;
                // Calculate clean price for comparison with strike
                const accruedInterest = calculateAccruedInterest(time, couponRate, principal, couponFreq, maturity);
                const pureBondPriceClean = node.pureBondPrice - (isCouponDate ? couponPayment : accruedInterest);
                                                           
                                                            const pureCallableBondPriceClean = callableContinuationValue - (isCouponDate ? couponPayment : accruedInterest);
 
                // If callable and clean price > strike price, then exercise
                if (isCallable && pureCallableBondPriceClean > strikePrice) {
                    node.callablePrice = strikePrice + (isCouponDate ? couponPayment : accruedInterest);
                    node.exercised = true;
                } else {
                    node.callablePrice = callableContinuationValue;
                }
 
                node.rate = node.j * dx + node.alpha;
 
                node.optionValue = node.pureBondPrice - node.callablePrice;
 
                //console.log(`  Node j=${node.j}: Rate=${(node.rate*100).toFixed(4)}%, PurePrice(Dirty)=${node.pureBondPrice.toFixed(4)}, Accrual=${accruedInterest.toFixed(4)}, PurePrice(Clean)=${pureBondPriceClean.toFixed(4)}, CallablePrice=${node.callablePrice.toFixed(4)}, OptionValue=${node.optionValue.toFixed(4)}, Exercised=${node.exercised}`);
            });
        }
 
        const rootNode = tree[0].nodes[0];
        //console.log(`\n--- Final Result ---`);
        //console.log(`Root node Q value: ${rootNode.Q.toFixed(8)} (Should be 1 for properly calibrated tree)`);
        //console.log(`Final Root Node Callable Price (t=0): ${rootNode.callablePrice.toFixed(8)}`);
 
        return { price: rootNode.callablePrice, tree };
    }
 
 
    // --- UI Update Functions ---
    function displayResults(results) {
        const { optionFreePrice, callableBondPrice, oas, impliedYield } = results;
 
        document.getElementById('optionFreePrice').textContent = optionFreePrice.toFixed(6);
        document.getElementById('callableBondPrice').textContent = callableBondPrice.toFixed(6);
        document.getElementById('optionValue').textContent = (optionFreePrice - callableBondPrice).toFixed(6);
 
        const oasElem = document.getElementById('oas');
        if (typeof oas === 'number') {
            oasElem.textContent = oas.toFixed(4);
        } else {
            oasElem.textContent = oas || "N/A (需市場價格)";
        }
 
        const yieldElem = document.getElementById('impliedYield');
         if (typeof impliedYield === 'number') {
            yieldElem.textContent = impliedYield.toFixed(4);
        } else {
            yieldElem.textContent = impliedYield || "N/A";
        }
 
        document.getElementById('results').style.display = 'block';
    }
 
    function displayTree(result) {
        const { tree, price } = result;
        const container = document.getElementById('tree-container');
        container.innerHTML = '';
 
        const firstStepNode = tree[0].nodes[0];
        const initialPu = firstStepNode && firstStepNode.pu !== undefined ? (firstStepNode.pu * 100).toFixed(2) : 'N/A';
        const initialPm = firstStepNode && firstStepNode.pm !== undefined ? (firstStepNode.pm * 100).toFixed(2) : 'N/A';
        const initialPd = firstStepNode && firstStepNode.pd !== undefined ? (firstStepNode.pd * 100).toFixed(2) : 'N/A';
 
        document.getElementById('tree-info').innerHTML = `
            初始價格: <strong>${price.toFixed(6)}</strong> |
            Time Step (dt): <strong>${tree[0].dt.toFixed(4)} years</strong> |
            初始節點機率 (Pu, Pm, Pd): <strong>${initialPu}%, ${initialPm}%, ${initialPd}%</strong>
        `;
 
        tree.forEach((step, stepIndex) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'tree-step';
            stepDiv.innerHTML = `<div class="step-label">步驟 ${stepIndex} (${step.nodes.length} 個節點)</div>`;
 
            // Sort nodes by rate in descending order before displaying
            // 在顯示之前，按利率降序排序節點
            const sortedNodes = [...step.nodes].sort((a, b) => b.rate - a.rate);
 
            sortedNodes.forEach(node => {
                const nodeDiv = document.createElement('div');
                nodeDiv.className = 'tree-node';
                if(node.exercised) {
                    nodeDiv.classList.add('early-exercise');
                }
 
                const probabilitiesHtml = node.pu !== undefined && stepIndex < tree.length - 1 ? `
                    <div class="probabilities">
                        Pu: ${(node.pu * 100).toFixed(2)}%<br>
                        Pm: ${(node.pm * 100).toFixed(2)}%<br>
                        Pd: ${(node.pd * 100).toFixed(2)}%
                    </div>
                ` : '';
 
                nodeDiv.innerHTML = `
                <div class="tree-node-content">
                    <span class="price-label">純債券價格</span>
                    <div class="node-bond-price">${(node.pureBondPrice || 0).toFixed(4)}</div>
                    <span class="price-label">可贖回債券價格</span>
                    <div class="node-option-price">${(node.callablePrice || 0).toFixed(4)}</div>
                    <span class="price-label">期權價值</span>
                    <div class="node-option-value">${(node.optionValue || 0).toFixed(4)}</div>
                    <span class="price-label">利率</span>
                    <div class="node-rate">${(node.rate * 100).toFixed(3)}%</div>
                </div>
                ${probabilitiesHtml}
            `;
                stepDiv.appendChild(nodeDiv);
            });
            container.appendChild(stepDiv);
        });
    }
 
    // Custom alert function
    // 自定義警示函數
    function showCustomAlert(message) {
        const alertBox = document.createElement('div');
        alertBox.className = 'custom-alert';
        alertBox.innerHTML = `
            <div class="custom-alert-content">
                <span class="custom-alert-close-btn">&times;</span>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(alertBox);
 
        const closeBtn = alertBox.querySelector('.custom-alert-close-btn');
        closeBtn.onclick = () => alertBox.remove();
        window.onclick = (event) => {
            if (event.target === alertBox) {
                alertBox.remove();
            }
        };
    }
});