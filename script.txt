let criteria = [];
let criteriaNames = [];
let scenarios = [];
let ahpMatrix = [];

// Add a new criteria input field
function addCriteria() {
    const criteriaSection = document.getElementById("criteria-section");

    // Create a container for each criteria
    const container = document.createElement("div");
    container.classList.add("criteria-container");

    // Input for criteria name
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Enter Criteria Name";
    criteriaNames.push(nameInput);
    container.appendChild(nameInput);

    criteria.push(nameInput);

    criteriaSection.appendChild(container);
    updateAHPMatrix();
}

// Remove last criteria input field
function removeCriteria() {
    if (criteria.length > 0) {
        const criteriaSection = document.getElementById("criteria-section");
        criteriaSection.removeChild(criteriaSection.lastChild);
        criteria.pop();
        criteriaNames.pop();
        updateAHPMatrix();
    }
}

// Add a new scenario with performance inputs
function addScenario() {
    const scenariosSection = document.getElementById("scenarios-section");

    const scenarioContainer = document.createElement("div");
    scenarioContainer.classList.add("scenario-container");

    const scenarioData = [];

    criteria.forEach((_, index) => {
        const input = document.createElement("input");
        input.type = "number";
        input.placeholder = `Performance for ${criteriaNames[index]?.value || `Criteria ${index + 1}`}`;
        scenarioData.push(input);
        scenarioContainer.appendChild(input);
    });

    const weightedPerformance = document.createElement("span");
    weightedPerformance.classList.add("weighted-performance");
    weightedPerformance.textContent = "Weighted: 0.00";
    scenarioContainer.appendChild(weightedPerformance);

    scenarios.push({ inputs: scenarioData, weightedPerformance });

    scenariosSection.appendChild(scenarioContainer);
}

// Remove last scenario
function removeScenario() {
    if (scenarios.length > 0) {
        const scenariosSection = document.getElementById("scenarios-section");
        scenariosSection.removeChild(scenariosSection.lastChild);
        scenarios.pop();
    }
}

// Update the AHP matrix for pairwise comparisons
function updateAHPMatrix() {
    const ahpSection = document.getElementById("ahp-comparison");
    ahpSection.innerHTML = ""; // Clear existing sliders

    ahpMatrix = Array(criteria.length).fill().map(() => Array(criteria.length).fill(1));

    for (let i = 0; i < criteria.length; i++) {
        for (let j = i + 1; j < criteria.length; j++) {
            const sliderDiv = document.createElement("div");
            sliderDiv.innerHTML = `
                <label>Compare ${criteriaNames[i]?.value || `Criteria ${i + 1}`} with ${criteriaNames[j]?.value || `Criteria ${j + 1}`}: 
                    <input type="range" min="1" max="9" value="1" step="1" 
                    onchange="updateAHPValue(${i}, ${j}, this.value)">
                </label>
            `;
            ahpSection.appendChild(sliderDiv);
        }
    }
}

// Update AHP value based on slider input
function updateAHPValue(i, j, value) {
    ahpMatrix[i][j] = parseInt(value);
    ahpMatrix[j][i] = 1 / parseInt(value);
}

// Calculate AHP weights
function calculateAHPWeights() {
    let sum = ahpMatrix.map(row => row.reduce((a, b) => a + b, 0));
    let normalizedMatrix = ahpMatrix.map((row, i) =>
        row.map(value => value / sum[i])
    );

    let weights = normalizedMatrix.map(row =>
        row.reduce((a, b) => a + b, 0) / criteria.length
    );

    console.log("AHP Weights:", weights);
    return weights;
}

// Calculate weighted performance for each scenario
function calculateWeightedPerformance() {
    const weights = calculateAHPWeights();

    scenarios.forEach(scenario => {
        let totalWeightedPerformance = 0;

        scenario.inputs.forEach((input, index) => {
            const value = parseFloat(input.value) || 0;
            totalWeightedPerformance += value * weights[index];
        });

        scenario.weightedPerformance.textContent = `Weighted: ${totalWeightedPerformance.toFixed(2)}`;
    });

    console.log("Weighted Performances calculated!");
}
