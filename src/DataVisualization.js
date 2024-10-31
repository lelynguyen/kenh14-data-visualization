// src/DataVisualization.js
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import Plot from "react-plotly.js";

const DataVisualization = () => {
  const [data, setData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  useEffect(() => {
    Papa.parse("/data.csv", {
      download: true,
      header: true,
      complete: function (results) {
        setData(results.data);
      },
    });
  }, []);

  // Lọc dữ liệu dựa trên chuyên mục được chọn
  const filteredData =
    selectedCategory === "Tất cả"
      ? data
      : data.filter((item) => item.chuyen_muc === selectedCategory);

  // Chuyển đổi định dạng ngày và số lượt xem
  const dates = filteredData.map((item) => new Date(item.ngay_dang));
  const views = filteredData.map((item) => Number(item.so_luot_xem));

  // Thống kê số bài viết theo chuyên mục
  const categoryCounts = {};
  data.forEach((item) => {
    const category = item.chuyen_muc || "Khác";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  // Thống kê từ khóa
  const keywordCounts = {};
  data.forEach((item) => {
    const keywords = item.tu_khoa ? item.tu_khoa.split(", ") : [];
    keywords.forEach((keyword) => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });
  });

  const topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="container">
      <h1>Phân tích dữ liệu Kenh14</h1>

      {/* Dropdown chọn chuyên mục */}
      <div className="filter">
        <label htmlFor="category">Chọn chuyên mục: </label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {["Tất cả", ...Object.keys(categoryCounts)].map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Biểu đồ lượt xem theo thời gian */}
      <div className="chart">
        <Plot
          data={[
            {
              x: dates,
              y: views,
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

      {/* Biểu đồ số bài viết theo chuyên mục */}
      <div className="chart">
        <Plot
          data={[
            {
              x: Object.keys(categoryCounts),
              y: Object.values(categoryCounts),
              type: "bar",
              marker: { color: "orange" },
            },
          ]}
          layout={{
            title: "Số bài viết theo chuyên mục",
            xaxis: { title: "Chuyên mục" },
            yaxis: { title: "Số bài viết" },
          }}
        />
      </div>

      {/* Biểu đồ tương quan giữa lượt xem và lượt chia sẻ */}
      <div className="chart">
        <Plot
          data={[
            {
              x: filteredData.map((item) => Number(item.so_luot_xem)),
              y: filteredData.map((item) => Number(item.luot_chia_se)),
              mode: "markers",
              type: "scatter",
              marker: { size: 8, color: "green" },
            },
          ]}
          layout={{
            title: "Tương quan giữa lượt xem và lượt chia sẻ",
            xaxis: { title: "Lượt xem" },
            yaxis: { title: "Lượt chia sẻ" },
          }}
        />
      </div>

      {/* Biểu đồ top 10 từ khóa được quan tâm */}
      <div className="chart">
        <Plot
          data={[
            {
              x: topKeywords.map((k) => k[0]),
              y: topKeywords.map((k) => k[1]),
              type: "bar",
              marker: { color: "purple" },
            },
          ]}
          layout={{
            title: "Top 10 từ khóa được quan tâm",
            xaxis: { title: "Từ khóa" },
            yaxis: { title: "Tần suất" },
          }}
        />
      </div>
    </div>
  );
};

export default DataVisualization;
