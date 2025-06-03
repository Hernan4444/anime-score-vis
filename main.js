let CONFIG = {
    border: false,
    anime: "Gintama",
    boxPlotParams: {
        width: 300,
        height: 750,
        margin: { top: 40, right: 10, bottom: 20, left: 20 }
    },
    heatmapParams: {
        width: 625,
        height: 750,
        margin: { top: 90, right: 10, left: 20 },
        N: 32, // number of columns,
        R: 8, // radius of the circles
        DELTA: 3 // distance between columns
    },
    linechart: {
        width: 449,
        height: 355,
        margin: { top: 20, right: 10, left: 30, bottom: 20 }
    },
    histogram: {
        width: 449,
        height: 355,
        margin: { top: 30, right: 10, left: 30, bottom: 20 }
    },
    transitions: 500,
}


d3.select("#darkmode").on("click", event => {
    d3.select("body").classed("dark-theme", event.target.checked);
    d3.select("#visBoxplot")
        .selectAll(".vis g.box")
        .attr("stroke", event.target.checked ? "#B0B0B0" : "black");
})

d3.json("code/data.json").then(datasets => {
    console.log(datasets)
    let names = datasets.map(d => d.name)
    d3.select("#anime")
        .selectAll("option")
        .data(names)
        .join("option")
        .attr("value", d => d)
        .text(d => d);

    d3.select("#anime")
        .on("change", event => {
            CONFIG.anime = event.target.value
            heatmap();
        })
    d3.select("#minColor").on("change", _ => heatmap())
    d3.select("#maxColor").on("change", _ => heatmap())
    startVisualization()
})

function startVisualization() {

    function prepareHeatmap() {
        const WIDTH = CONFIG.heatmapParams.width;
        const HEIGHT = CONFIG.heatmapParams.height;
        const MARGIN = CONFIG.heatmapParams.margin;

        const svg = d3.select("#visHeatmap")
            .attr("width", WIDTH)
            .attr("height", HEIGHT);

        svg.append("g").attr("id", "visG")
            .attr("transform", `translate(${MARGIN.right}, ${MARGIN.top})`);

        const contextG = svg.append("g").append("g").attr("id", "contextG")
            .attr("transform", `translate(${MARGIN.right}, 20)`)

        contextG.append("defs")
            .append("linearGradient")
            .attr("id", "linear-gradient");
    }

    function prepareBoxplot() {
        const margin = CONFIG.boxPlotParams.margin
        const width = CONFIG.boxPlotParams.width;
        const height = CONFIG.boxPlotParams.height;

        let vis = d3.select("#visBoxplot")
            .attr("width", width)
            .attr("height", height)
            .append("g").attr("class", "vis")
            .attr("transform", `translate(${margin.left},${margin.top})`)

        const realHeight = height - margin.top - margin.bottom;
        vis.append("g").attr("class", "axisY")
        vis.append("g").attr("class", "axisX").attr("transform", `translate(0,${realHeight})`);

    }

    function prepareLinechart() {
        const margin = CONFIG.linechart.margin;
        const width = CONFIG.linechart.width;
        const height = CONFIG.linechart.height;

        let vis = d3.select("#visLineChart")
            .attr("width", width)
            .attr("height", height)
            .append("g").attr("class", "vis")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const realHeight = height - margin.top - margin.bottom;
        vis.append("g").attr("class", "axisY")
        vis.append("g").attr("class", "axisX").attr("transform", `translate(0,${realHeight})`);
        d3.select("#visLineChart").append("text").attr("class", "title")
            .attr("x", width / 2)
            .attr("y", 10)
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "middle")
            .text("Score per Chapter");

    }
    function prepareHistogram() {
        const margin = CONFIG.histogram.margin;
        const width = CONFIG.histogram.width;
        const height = CONFIG.histogram.height;

        let vis = d3.select("#visHistogram")
            .attr("width", width)
            .attr("height", height)
            .append("g").attr("class", "vis")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const realHeight = height - margin.top - margin.bottom;
        vis.append("g").attr("class", "axisY")
        vis.append("g").attr("class", "axisX").attr("transform", `translate(0,${realHeight})`);

        d3.select("#visHistogram").append("text").attr("class", "title")
            .attr("x", width / 2)
            .attr("y", 10)
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "middle")
            .text("Score Distribution");
    }


    prepareHeatmap()
    prepareBoxplot()
    prepareLinechart()
    prepareHistogram()


    heatmap()
}


function updateInfoDiv(anime, chapter, evento) {

    let width = document.body.clientWidth;

    let posX;
    if (evento.pageX + 15 + 300 > width) {
        if (evento.pageX + 150 > width) {
            posX = evento.pageX - 300 - 45
        }
        else {
            posX = evento.pageX - 150
        }
    }
    else {
        posX = evento.pageX + 15;
    }


    d3.select(".info")
        .style("opacity", "1")
        .style("left", (posX) + "px")
        .style("top", (evento.pageY + 15) + "px");

    d3.select("#imgInfo").attr("src", `code/img/${anime}/img_${chapter.id}.jpg`)
    d3.select("#titleInfo").text(chapter.title)
    d3.select("#seasonInfo").text(chapter.imdb_season)
    d3.select("#chapterInfo").text(chapter.chapter)
    let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    d3.select("#releaseInfo").text(chapter.release.toLocaleDateString("en-US", options))
    d3.select("#sinopsysInfo").text(chapter.subtitle)
}

function heatmap() {
    const anime = CONFIG.anime;
    const N = CONFIG.heatmapParams.N; // number of columns
    const R = CONFIG.heatmapParams.R; // radius of the circles
    const DELTA = CONFIG.heatmapParams.DELTA; // space between circles

    const visWidth = (2 * R + DELTA) * N;

    const svg = d3.select("#visHeatmap");
    const visG = svg.select("#visG");
    const contextG = svg.select("#contextG");
    const linearGradient = contextG.select("linearGradient");

    d3.tsv(`code/data/${anime}.tsv`, d3.autoType).then(d => {
        // updateInfoDiv(anime, d[0]);
        boxPlot(d);
        linechart(d)
        histogram(d);

        let minScoreValue = d3.select("#minColor").property("value");
        let maxScoreValue = d3.select("#maxColor").property("value");

        minScoreValue = minScoreValue == "default" ? d3.min(d, d => d.score) : +minScoreValue;
        maxScoreValue = maxScoreValue == "default" ? d3.max(d, d => d.score) : +maxScoreValue;


        const scoreScale = d3.scaleSequential(d3.interpolateReds)
            .domain([minScoreValue, maxScoreValue]);

        const posScoreScale = d3.scaleLinear()
            .domain([minScoreValue, maxScoreValue])
            .range([0, visWidth]);


        let last = 1;
        let pos = [-1, 0];
        d.map((e, i) => {
            pos[0]++;
            if (e.imdb_season != last) {
                pos[1]++;
                pos[1]++;
                pos[0] = 0
                last = e.imdb_season
            }

            if (pos[0] == N) {
                pos[1]++;
                pos[0] = 0
            }
            e.pos = [pos[0], pos[1]];
        })


        const episodeMark = visG.selectAll(".episodeMark")
            .data(d)
            .join(
                enter => {
                    const mark = enter.append("g").attr("class", "episodeMark");

                    if (CONFIG.border) {
                        mark.attr("transform", (d, i) => {
                            let x = d.pos[0] * (2 * R + DELTA);
                            let y = d.pos[1] * (2 * R + DELTA);
                            return `translate(${x}, ${y})`;
                        })
                    }
                    else {
                        mark.attr("transform", (d, i) => {
                            let x = (i % N) * (2 * R + DELTA);
                            let y = Math.floor(i / N) * (2 * R + DELTA);
                            return `translate(${x}, ${y})`;
                        })
                    }

                    const canon = mark.filter(d => d.canon == "canon")
                        .append("rect")
                        .attr("x", R)
                        .attr("y", R)
                        .attr("width", 0)
                        .attr("height", 0)
                        .attr("fill", d => scoreScale(d.score))


                    canon.transition("heatmap-enter").duration(CONFIG.transitions)
                        .attr("x", 0)
                        .attr("y", 0)
                        .attr("width", 2 * R)
                        .attr("height", 2 * R)

                    mark.filter(d => d.canon != "canon")
                        .append("circle")
                        .attr("r", R)
                        .attr("cx", R)
                        .attr("cy", R)
                        .attr("fill", d => scoreScale(d.score))

                    mark
                        .attr("stroke", d => scoreScale(d.score))
                        .attr("stroke-width", "2px");

                    return mark;
                },
                update => {
                    if (CONFIG.border) {
                        update
                            .transition("heatmap-update")
                            .duration(CONFIG.transitions)
                            .attr("transform", (d, i) => {
                                let x = (d.pos[0]) * (2 * R + DELTA);
                                let y = d.pos[1] * (2 * R + DELTA);
                                return `translate(${x}, ${y})`;
                            })
                    }
                    else {
                        update
                            .transition("heatmap-update")
                            .duration(CONFIG.transitions)
                            .attr("transform", (d, i) => {
                                let x = (i % N) * (2 * R + DELTA);
                                let y = Math.floor(i / N) * (2 * R + DELTA);
                                return `translate(${x}, ${y})`;
                            })
                    }

                    update
                        .select("rect")
                        .transition("heatmap-update-fill").duration(CONFIG.transitions)
                        .attr("fill", d => scoreScale(d.score))

                    update
                        .transition("heatmap-update-stroke").duration(CONFIG.transitions)
                        .attr("stroke", d => scoreScale(d.score))

                    return update
                },
                exit => {
                    exit.selectAll("rect")
                        .transition("heatmap-exit").duration(CONFIG.transitions)
                        .attr("width", 0)
                        .attr("height", 0)
                        .attr("x", R)
                        .attr("y", R)

                    return exit.transition("heatmap-exit-remove").delay(CONFIG.transitions).remove()
                }
            )
            .on("mouseenter", (event, selected) => {
                legendRect
                    .attr("x", posScoreScale(selected.score))
                    .attr("opacity", 1);

                d3.select(event.target).attr("stroke", "black");

                d3.select("#visBoxplot")
                    .selectAll("g.box")
                    .select(".hover")
                    .style("stroke", d => d.key == selected.imdb_season ? "red" : "transparent");

                updateInfoDiv(anime, selected, event);
            })
            .on("mouseleave", (event, d) => {
                legendRect.attr("opacity", 0);
                d3.select(".info").style("opacity", 0);
                d3.select("#visBoxplot").selectAll("g.box").select(".hover").style("stroke", "transparent");
                visG.selectAll(".episodeMark").attr("stroke", d => scoreScale(d.score))
            })

        d3.select("#seasons").on("click", event => {
            CONFIG.border = event.target.checked;
            heatmap()
        })

        contextG
            .selectAll(".title")
            .data([anime])
            .join("text")
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "middle")
            .attr("x", visWidth / 2)
            .attr("y", 0)
            .attr("class", "title")
            .text(d => `${d} Score per Chapter`);

        let delta = maxScoreValue - minScoreValue
        linearGradient
            .selectAll("stop")
            .data([
                { offset: "0%", color: scoreScale(minScoreValue) },
                { offset: "25%", color: scoreScale(minScoreValue + delta / 4) },
                { offset: "50%", color: scoreScale(minScoreValue + delta / 2) },
                { offset: "75%", color: scoreScale(minScoreValue + 3 * delta / 4) },
                { offset: "100%", color: scoreScale(maxScoreValue) }
            ])
            .join("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        contextG
            .selectAll("rect")
            .data([anime])
            .join("rect")
            .attr("x", 0)
            .attr("y", 10)
            .attr("width", visWidth)
            .attr("height", 20)
            .style("fill", "url(#linear-gradient)");

        contextG
            .selectAll(".textLegend")
            .data([minScoreValue, maxScoreValue])
            .join("text")
            .attr("class", "textLegend")
            .attr("x", d => d == minScoreValue ? 0 : visWidth)
            .attr("y", 30)
            .attr("dominant-baseline", "text-before-edge")
            .attr("text-anchor", d => d == minScoreValue ? "start" : "end")
            .text(d => d)

        const legendRect = contextG
            .selectAll("#legendRect")
            .data([anime])
            .join("rect")
            .attr("y", 10)
            .attr("id", "legendRect")
            .attr("height", 20)
            .attr("width", 3)
            .attr("fill", "black")
            .attr("opacity", "0");

        const brush = d3.brushX()
            .extent([[0, 10], [visWidth, 30]])
            .on("brush end", brushed);

        contextG.selectAll(".brush").data([anime]).join("g")
            .attr("class", "brush")
            .call(brush)
            .call(brush.move, null)

        function brushed({ selection }) {
            if (!selection) {
                episodeMark.style("filter", null)
                return;
            }
            const [x0, x1] = selection;
            const minScoreBrush = posScoreScale.invert(x0);
            const maxScoreBrush = posScoreScale.invert(x1);
            episodeMark.style("filter", d => {
                if (minScoreBrush <= d.score && d.score <= maxScoreBrush)
                    return null;
                return 'opacity(10%)'
            })

        }

    })


}


function boxPlot(data) {
    const anime = CONFIG.anime;

    const svg = d3.select("#visBoxplot").select(".vis");
    const margin = CONFIG.boxPlotParams.margin;
    const width = CONFIG.boxPlotParams.width - margin.left - margin.right;
    const height = CONFIG.boxPlotParams.height - margin.top - margin.bottom;

    const y = d3.scaleBand()
        .range([0, height])
        .domain([...new Set(data.map(d => d.imdb_season))])
        .padding(0.3);

    const x = d3.scaleLinear()
        .domain([Math.floor(d3.min(data, d => d.score) * 0.9), 10])
        .range([0, width]);

    const boxHeight = y.bandwidth();

    svg.select(".axisY").call(d3.axisLeft(y));
    svg.select(".axisX").call(d3.axisBottom(x).ticks(4));

    const sumstat = Array.from(d3.group(data, d => d.imdb_season), ([key, value]) => {
        const scores = value.map(d => d.score).sort(d3.ascending);
        const q1 = d3.quantile(scores, .25);
        const median = d3.quantile(scores, .5);
        const q3 = d3.quantile(scores, .75);
        const interQuantileRange = q3 - q1;
        const min = Math.max(d3.min(scores), q1 - 1.5 * interQuantileRange);
        const max = Math.min(d3.max(scores), q3 + 1.5 * interQuantileRange);
        const outliers = scores.filter(d => d < min || d > max);

        return { key, q1, median, q3, interQuantileRange, min, max, outliers };
    });

    const seasonScale = d3.scaleOrdinal(d3.schemeDark2)
        .domain(data.map(d => d.imdb_season));


    d3.select("#visBoxplot")
        .selectAll(".title")
        .data([anime])
        .join("text")
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", "middle")
        .attr("x", CONFIG.boxPlotParams.width / 2)
        .attr("y", 20)
        .attr("class", "title")
        .text(`Score per Season`);



    svg.selectAll("g.box")
        .data(sumstat, d => d.key)
        .join(
            enter => {
                const g = enter.append("g")
                    .attr("class", "box")
                    .attr("transform", d => `translate(0,${y(d.key) + boxHeight / 2})`)
                    .attr("stroke", "#B0B0B0");

                g.append("line")
                    .attr("class", "range")
                    .attr("x1", 0)
                    .attr("x2", 0)
                    .attr("y1", 0)
                    .attr("y2", 0)
                    .transition("boxplot-enter-line")
                    .duration(CONFIG.transitions)
                    .attr("x1", d => x(d.min))
                    .attr("x2", d => x(d.max));

                g.append("rect")
                    .attr("class", "box")
                    .attr("x", 0)
                    .attr("y", -boxHeight / 2)
                    .attr("height", boxHeight)
                    .attr("width", 0)
                    .style("fill", d => seasonScale(d.key))
                    .transition("boxplot-enter-rect")
                    .duration(CONFIG.transitions)
                    .attr("x", d => x(d.q1))
                    .attr("width", d => x(d.q3) - x(d.q1));

                g.selectAll(".whisker")
                    .data(d => [d.min, d.max])
                    .enter()
                    .append("line")
                    .attr("class", "whisker")
                    .attr("x1", 0)
                    .attr("x2", 0)
                    .attr("y1", -boxHeight / 2)
                    .attr("y2", boxHeight / 2)
                    .transition("boxplot-enter-whisker")
                    .duration(CONFIG.transitions)
                    .attr("x1", x)
                    .attr("x2", x);

                g.append("line")
                    .attr("class", "median")
                    .attr("x1", 0)
                    .attr("x2", 0)
                    .attr("y1", -boxHeight / 2)
                    .attr("y2", boxHeight / 2)
                    .transition("boxplot-enter-median")
                    .duration(CONFIG.transitions)
                    .attr("x1", d => x(d.median))
                    .attr("x2", d => x(d.median));

                g.selectAll(".outlier")
                    .data(d => d.outliers)
                    .join("circle")
                    .attr("class", "outlier")
                    .attr("cy", 0)
                    .attr("cx", 0)
                    .attr("r", 0)
                    .attr("fill", "red")
                    .transition("boxplot-enter-outlier")
                    .duration(CONFIG.transitions)
                    .attr("cx", x)
                    .attr("r", 3);

                g.append("rect").attr("class", "hover")
                    .attr("width", width)
                    .attr("height", boxHeight)
                    .attr("y", -boxHeight / 2)
                    .attr("fill", "transparent")
                    .attr("stroke", "transparent")

                return g;
            },
            update => {
                update.transition("boxplot-update-position")
                    .duration(CONFIG.transitions)
                    .attr("transform", d => `translate(0,${y(d.key) + boxHeight / 2})`)

                update.select(".hover")
                    .attr("height", boxHeight)
                    .attr("y", -boxHeight / 2)

                update
                    .select(".range")
                    .transition("boxplot-update-range")
                    .duration(CONFIG.transitions)
                    .attr("x1", d => x(d.min))
                    .attr("x2", d => x(d.max));

                update
                    .select("rect.box")
                    .transition("boxplot-update-rect")
                    .duration(CONFIG.transitions)
                    .attr("x", d => x(d.q1))
                    .attr("y", -boxHeight / 2)
                    .attr("height", boxHeight)
                    .attr("width", d => x(d.q3) - x(d.q1))

                update
                    .selectAll(".whisker")
                    .data(d => [d.min, d.max])
                    .join("line")
                    .transition("boxplot-update-whisker")
                    .duration(CONFIG.transitions)
                    .attr("x1", x)
                    .attr("x2", x)
                    .attr("y1", -boxHeight / 2)
                    .attr("y2", boxHeight / 2);

                update
                    .select(".median")
                    .transition("boxplot-update-median")
                    .duration(CONFIG.transitions)
                    .attr("x1", d => x(d.median))
                    .attr("x2", d => x(d.median))
                    .attr("y1", -boxHeight / 2)
                    .attr("y2", boxHeight / 2);

                update
                    .selectAll(".outlier")
                    .data(d => d.outliers)
                    .join(
                        enter => enter.append("circle")
                            .attr("class", "outlier")
                            .attr("cx", 0)
                            .attr("cy", 0)
                            .attr("r", 0)
                            .attr("fill", "red")
                            .transition("boxplot-update-outlier-enter")
                            .duration(CONFIG.transitions)
                            .attr("cx", x)
                            .attr("r", 3),
                        update => update.transition("boxplot-update-outlier")
                            .duration(CONFIG.transitions)
                            .attr("cx", x),
                        exit => exit.transition("boxplot-update-outlier-exit")
                            .duration(CONFIG.transitions).attr("r", 0).remove()
                    )

                return update;
            },
            exit => {

                exit
                    .select(".range")
                    .transition("boxplot-exit-range")
                    .duration(CONFIG.transitions)
                    .attr("x1", 0)
                    .attr("x2", 0);

                exit
                    .select("rect.box")
                    .transition("boxplot-exit-rect")
                    .duration(CONFIG.transitions)
                    .attr("x", 0)
                    .attr("width", 0)

                exit
                    .selectAll(".whisker")
                    .transition("boxplot-exit-whisker")
                    .duration(CONFIG.transitions)
                    .attr("x1", 0)
                    .attr("x2", 0);

                exit
                    .select(".median")
                    .transition("boxplot-exit-median")
                    .duration(CONFIG.transitions)
                    .attr("x1", 0)
                    .attr("x2", 0);

                exit
                    .selectAll(".outlier")
                    .transition("boxplot-exit-outlier")
                    .duration(CONFIG.transitions).attr("r", 0);

                exit.transition("boxplot-exit-remove")
                    .delay(CONFIG.transitions)
                    .remove();
            }
        )

    let selectedSeason = null;
    svg.selectAll("g.box").attr("opacity", 1);
    d3.select("#visHeatmap").selectAll(".episodeMark").attr("opacity", 1);

    svg.selectAll("g.box")
        .on("click", (event, d) => {
            if (selectedSeason == d.key) {
                selectedSeason = null;
                svg.selectAll("g.box").attr("opacity", 1);
                d3.select("#visHeatmap").selectAll(".episodeMark").attr("opacity", 1);
                linechart(data, null);
                histogram(data, null);
                return;
            } else {
                selectedSeason = d.key;
            }
            let color = seasonScale(d.key)
            // Actualizar las visualizaciones secundarias
            linechart(data.filter(e => e.imdb_season == d.key), d.key, color);
            histogram(data.filter(e => e.imdb_season == d.key), d.key, color);

            // Resaltar la temporada seleccionada
            svg.selectAll("g.box").attr("opacity", e => e == d ? 1 : 0.2);
            d3.select("#visHeatmap")
                .selectAll(".episodeMark")
                .attr("opacity", e => e.imdb_season == d.key ? 1 : 0.2);
        })
}

function linechart(data, season, color = "steelblue") {
    const svg = d3.select("#visLineChart").select(".vis");
    const margin = CONFIG.linechart.margin;
    const width = CONFIG.linechart.width - margin.left - margin.right;
    const height = CONFIG.linechart.height - margin.top - margin.bottom;

    d3.select("#visLineChart")
        .select(".title")
        .text(season == null ? "Score per Chapter" : `Score per Chapter in Season ${season}`)

    const x = d3.scaleLinear()
        .domain([0, data.length])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, 10])
        .range([height, 0])
        .nice();

    svg.select(".axisX").call(d3.axisBottom(x).ticks(5));
    svg.select(".axisY").call(d3.axisLeft(y).ticks(5));

    const line = d3.line()
        .x((_, i) => x(i))
        .y(d => y(d.score))
        .curve(d3.curveNatural);

    svg.selectAll(".line").data([data])
        .join(
            enter => enter.append("path")
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-width", 2)
                .attr("opacity", 0)
                .attr("d", d => line(d))
                .transition("linechart-enter")
                .duration(CONFIG.transitions)
                .attr("opacity", 1),

            update => update
                .transition("linechart-update")
                .duration(CONFIG.transitions / 2)
                .attr("opacity", 0)
                .transition("linechart-update-path")
                .duration(0)
                .attr("stroke", color)
                .attr("d", d => line(d))
                .transition("linechart-update-opacity")
                .duration(CONFIG.transitions / 2)
                .attr("opacity", 1),
            exit => exit.transition("linechart-exit")
                .duration(CONFIG.transitions / 2)
                .attr("opacity", 0)
                .remove()
        );

}

function histogram(data, season, color = "steelblue") {
    const svg = d3.select("#visHistogram").select(".vis");
    const margin = CONFIG.histogram.margin;
    const width = CONFIG.histogram.width - margin.left - margin.right;
    const height = CONFIG.histogram.height - margin.top - margin.bottom;

    d3.select("#visHistogram")
        .select(".title")
        .text(season == null ? "Score Distribution" : `Score Distribution in Season ${season}`)


    const bins = d3.bin()
        .thresholds(5)
        .value(d => d.score);

    const histogramData = bins(data);
    console.log(histogramData);


    const x = d3.scaleBand()
        .domain(histogramData.map(d => d.x0))
        .range([0, width])
        .padding(0.1)
        .align(0.5);

    const y = d3.scaleLinear()
        .domain([0, d3.max(histogramData, d => d.length)])
        .range([height, 0])
        .nice();

    let ticks = y.ticks();
    ticks = ticks.filter(tick => Number.isInteger(tick));

    // Hace que el eje X diga el rango de cada barra
    svg.select(".axisX").call(d3.axisBottom(x));

    svg.select(".axisX")
        .selectAll("text")
        .data(histogramData)
        .join("text")
        .text(d => `[${d.x0} - ${d.x1})`);


    svg.select(".axisY").call(d3.axisLeft(y).tickValues(ticks).tickFormat(d3.format("d")));

    svg.selectAll(".bar")
        .data(histogramData, d => d.x0)
        .join(
            enter => enter.append("rect")
                .attr("class", "bar")
                .attr("x", d => x(d.x0))
                .attr("y", height)
                .attr("width", x.bandwidth())
                .attr("height", 0)
                .attr("fill", color)
                .transition("histogram-enter")
                .duration(CONFIG.transitions)
                .attr("y", d => y(d.length))
                .attr("height", d => height - y(d.length)),

            update => update
                .transition("histogram-update")
                .duration(CONFIG.transitions)
                .attr("x", d => x(d.x0))
                .attr("y", d => y(d.length))
                .attr("width", x.bandwidth())
                .attr("height", d => height - y(d.length))
                .attr("fill", color),

            exit => exit.transition("histogram-exit")
                .duration(CONFIG.transitions)
                .attr("height", 0)
                .attr("y", height)
                .remove()
        );


}