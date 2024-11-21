// src/DataVisualization.js
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
// Nếu bạn gặp vấn đề với Plotly.js, sử dụng cách import dưới đây
// import createPlotlyComponent from "react-plotly.js/factory";
// import Plotly from "plotly.js-basic-dist-min";
// const Plot = createPlotlyComponent(Plotly);

import Plot from "react-plotly.js";

const DataVisualization = () => {
  const [data, setData] = useState([]);
  const [selectedAuthor, setSelectedAuthor] = useState("Tất cả");

  useEffect(() => {
    Papa.parse("/merged_news_data.csv", {
      download: true,
      header: true,
      complete: function (results) {
        console.log("Dữ liệu CSV:", results.data);
        setData(results.data);
      },
    });
  }, []);

  // Lọc dữ liệu dựa trên tác giả được chọn
  const filteredData =
    selectedAuthor === "Tất cả"
      ? data
      : data.filter((item) => item.author === selectedAuthor);

  // Chuyển đổi định dạng ngày và số lượt xem
  const dates = filteredData.map((item) => new Date(item.uploadtime));
  const views = filteredData.map((item) => Number(item.views));

  // Kiểm tra và loại bỏ các giá trị không hợp lệ
  const validData = filteredData.filter(
    (item) =>
      item.uploadtime &&
      !isNaN(new Date(item.uploadtime)) &&
      item.views &&
      !isNaN(Number(item.views))
  );

  const validDates = validData.map((item) => new Date(item.uploadtime));
  const validViews = validData.map((item) => Number(item.views));

  // Thống kê số bài viết theo tác giả
  const authorCounts = {};
  data.forEach((item) => {
    const author = item.author || "Khác";
    authorCounts[author] = (authorCounts[author] || 0) + 1;
  });

  // Thống kê top 10 tác giả được quan tâm và số lượt xem các bài viết của họ
  const authorViews = {};
  data.forEach((item) => {
    const author = item.author || "Khác";
    const viewCount = item.views ? Number(item.views) : 0;
    authorViews[author] = (authorViews[author] || 0) + viewCount;
  });

  const topAuthors = Object.entries(authorViews)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="container">
      <h1>Phân tích dữ liệu Kenh14</h1>

      {/* Dropdown chọn tác giả */}
      <div className="filter">
        <label htmlFor="author">Chọn tác giả: </label>
        <select
          id="author"
          value={selectedAuthor}
          onChange={(e) => setSelectedAuthor(e.target.value)}
        >
          {["Tất cả", ...Object.keys(authorCounts)].map((author) => (
            <option key={author} value={author}>
              {author}
            </option>
          ))}
        </select>
      </div>

      {/* Biểu đồ lượt xem theo thời gian */}
      <div className="chart">
        <Plot
          data={[
            {
              x: validDates,
              y: validViews,
              type: "scatter",
              mode: "lines+markers",
              marker: { color: "blue" },
            },
          ]}
          layout={{
            title: "Lượt xem theo thời gian",
            xaxis: { title: "Thời gian" },
            yaxis: { title: "Lượt xem" },
          }}
        />
      </div>

      {/* Biểu đồ số bài viết theo tác giả */}
      <div className="chart">
        <Plot
          data={[
            {
              x: Object.keys(authorCounts),
              y: Object.values(authorCounts),
              type: "bar",
              marker: { color: "orange" },
            },
          ]}
          layout={{
            title: "Số bài viết theo tác giả",
            xaxis: { title: "Tác giả" },
            yaxis: { title: "Số bài viết" },
          }}
        />
      </div>

      {/* Biểu đồ top 10 tác giả được quan tâm */}
      <div className="chart">
        <Plot
          data={[
            {
              x: topAuthors.map((a) => a[0]),
              y: topAuthors.map((a) => a[1]),
              type: "bar",
              marker: { color: "purple" },
            },
          ]}
          layout={{
            title: "Top 10 tác giả được quan tâm",
            xaxis: { title: "Tác giả" },
            yaxis: { title: "Lượt xem" },
          }}
        />
      </div>
    </div>
  );
};

export default DataVisualization;
