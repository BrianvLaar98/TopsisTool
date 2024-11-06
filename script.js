
let criteria = [];
let criteriaNames = [];
let scenarios = [];
let ahpMatrix = [];

// Add a new criteria input field
function addCriteria() {
    const criteriaSection = document.getElementById("criteria-section");
    const criteriaHeaders = document.getElementById("criteria-headers");
    const standardizedHeaders = document.getElementById("standardized-headers");
    const weightedStandardizedHeaders = document.getElementById("weighted-standardized-headers");

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Enter Criteria Name";
    criteriaNames.push(nameInput);
    criteria.push(nameInput);

    // Add criteria headers
    const headerCell = document.createElement("th");
    headerCell.appendChild(nameInput);
    criteriaHeaders.appendChild(headerCell);

    const standardHeaderCell = document.createElement("th");
    standardHeaderCell.appendChild(document.createTextNode("Standardized"));
    standardizedHeaders.appendChild(standardHeaderCell);

    const weightedStandardHeaderCell = document.createElement("th");
    weightedStandardHeaderCell.appendChild(document.createTextNode("Weighted"));
    weightedStandardizedHeaders.appendChild(weightedStandardHeaderCell);

    updateAHPMatrix();
}

// Add a new scenario row
function addScenario() {
    const scenariosBody = document.getElementById("scenarios-body");
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Scenario Name";
    nameCell.appendChild(nameInput);
    row.appendChild(nameCell);

    const scenarioData = [nameInput];

    criteria.forEach(() => {
        const inputCell = document.createElement("td");
        const input = document.createElement("input");
        input.type = "number";
        input.placeholder = "Performance";
        inputCell.appendChild(input);
        row.appendChild(inputCell);
        scenarioData.push(input);
    });

    scenarios.push(scenarioData);
    scenariosBody.appendChild(row);
}

// Update AHP matrix with sliders and horizontal legend
function updateAHPMatrix() {
    const ahpSection = document.getElementById("ahp-comparison");
    ahpSection.innerHTML = ""; 

    ahpMatrix = Array(criteria.length).fill().map(() => Array(criteria.length).fill(1));

    for (let i = 0; i < criteria.length; i++) {
        for (let j = i + 1; j < criteria.length; j++) {
            const sliderDiv = document.createElement("div");
            sliderDiv.classList.add("slider-container");
            sliderDiv.innerHTML = `
                <div>${criteriaNames[i].value || `Criteria ${i + 1}`}</div>
                <label>
                    <input type="range" min="1" max="9" value="1" step="1" 
                    onchange="updateAHPValue(${i}, ${j}, this.value)">
                    <div class="ahp-scale">
                        <span>1</span><span>3</span><span>5</span><span>7</span><span>9</span>
                    </div>
                </label>
                <div>${criteriaNames[j].value || `Criteria ${j + 1}`}</div>
            `;
            ahpSection.appendChild(sliderDiv);
        }
    }
}

// Update AHP matrix based on slider input
function updateAHPValue(i, j, value) {
    ahpMatrix[i][j] = parseInt(value);
    ahpMatrix[j][i] = 1 / parseInt(value);
}

// Calculate AHP weights and display them
function calculateAHPWeights() {
    let sum = ahpMatrix.map(row => row.reduce((a, b) => a + b, 0));
    let normalizedMatrix = ahpMatrix.map((row, i) =>
        row.map(value => value / sum[i])
    );

    let weights = normalizedMatrix.map(row =>
        row.reduce((a, b) => a + b, 0) / criteria.length
    );

    document.getElementById("ahp-weights").innerHTML = `<h3>Criteria Weights:</h3><p>${weights.map((w, i) => `${criteriaNames[i].value || `Criteria ${i + 1}`}: ${w.toFixed(4)}`).join('<br>')}</p>`;
    return weights;
}

// Standardize performance values across all criteria
function standardizePerformance(performanceMatrix) {
    const means = performanceMatrix[0].map((_, j) =>
        performanceMatrix.reduce((sum, scenario) => sum + scenario[j], 0) / performanceMatrix.length
    );

    const stdDevs = performanceMatrix[0].map((_, j) =>
        Math.sqrt(
            performanceMatrix.reduce((sum, scenario) => sum + Math.pow(scenario[j] - means[j], 2), 0) / performanceMatrix.length
        )
    );

    return performanceMatrix.map(scenario =>
        scenario.map((value, j) => (value - means[j]) / (stdDevs[j] || 1))
    );
}

// Display weighted standardized matrix and apply AHP weights
function displayWeightedStandardizedMatrix(standardizedMatrix, weights) {
    const weightedStandardizedBody = document.getElementById("weighted-standardized-body");
    weightedStandardizedBody.innerHTML = "";

    standardizedMatrix.forEach((scenario, i) => {
        const row = document.createElement("tr");
        const scenarioNameCell = document.createElement("td");
        scenarioNameCell.textContent = scenarios[i][0].value || `Scenario ${i + 1}`;
        row.appendChild(scenarioNameCell);

        scenario.forEach((value, j) => {
            const weightedValue = value * weights[j];
            const cell = document.createElement("td");
            cell.textContent = weightedValue.toFixed(4);
            row.appendChild(cell);
        });
        weightedStandardizedBody.appendChild(row);
    });
}

// Rank scenarios using TOPSIS method
function rankScenarios() {
    const weights = calculateAHPWeights();
    const performanceMatrix = scenarios.map(scenario =>
        scenario.slice(1).map(input => parseFloat(input.value) || 0)
    );

    const standardizedMatrix = standardizePerformance(performanceMatrix);
    const standardizedBody = document.getElementById("standardized-body");
    standardizedBody.innerHTML = "";

    standardizedMatrix.forEach((scenario, i) => {
        const row = document.createElement("tr");
        const scenarioNameCell = document.createElement("td");
        scenarioNameCell.textContent = scenarios[i][0].value || `Scenario ${i + 1}`;
        row.appendChild(scenarioNameCell);

        scenario.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value.toFixed(4);
            row.appendChild(cell);
        });
        standardizedBody.appendChild(row);
    });

    displayWeightedStandardizedMatrix(standardizedMatrix, weights);

    const weightedMatrix = standardizedMatrix.map(scenario =>
        scenario.map((value, j) => value * weights[j])
    );

    const idealSolution = Array(criteria.length).fill().map((_, j) => Math.max(...weightedMatrix.map(scenario => scenario[j])));
    const antiIdealSolution = Array(criteria.length).fill().map((_, j) => Math.min(...weightedMatrix.map(scenario => scenario[j])));

    const distancesToIdeal = weightedMatrix.map(scenario =>
        Math.sqrt(scenario.reduce((sum, value, j) => sum + Math.pow(value - idealSolution[j], 2), 0))
    );

    const distancesToAntiIdeal = weightedMatrix.map(scenario =>
        Math.sqrt(scenario.reduce((sum, value, j) => sum + Math.pow(value - antiIdealSolution[j], 2), 0))
    );

    const topsisScores = distancesToAntiIdeal.map((distance, i) =>
        distance / (distance + distancesToIdeal[i])
    );

    const rankedScenarios = topsisScores
        .map((score, i) => ({ name: scenarios[i][0].value, score }))
        .sort((a, b) => b.score - a.score);

    const rankingResults = document.getElementById("ranking-results");
    rankingResults.innerHTML = "<h3>Ranking Results</h3>" + rankedScenarios.map((scenario, i) =>
        `<p>${i + 1}. ${scenario.name}: ${scenario.score.toFixed(4)}</p>`
    ).join("");
}
