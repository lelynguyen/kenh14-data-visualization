// src/DataVisualization.js
import React, { useEffect, useState } from "react";
import database from "./firebase";
import { ref, onValue, off } from "firebase/database";
import Plot from "react-plotly.js";
import { format } from "date-fns";
import _ from "lodash";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import "chartjs-plugin-datalabels";
import * as echarts from "echarts";
import "echarts-wordcloud";

import Sentiment from "sentiment";

// Đăng ký các thành phần của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DataVisualization = () => {
  const [data, setData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [topN, setTopN] = useState(10); // Giá trị mặc định là top 10
  const [recentPostsCount, setRecentPostsCount] = useState(5); // Số lượng bài đăng gần đây

  useEffect(() => {
    const articlesRef = ref(database, "articles");

    const unsubscribe = onValue(articlesRef, (snapshot) => {
      const articlesObj = snapshot.val();
      if (articlesObj) {
        console.log("Dữ liệu từ Firebase:", articlesObj);
        // Chuyển đổi dữ liệu từ object sang mảng
        const articlesArray = Object.values(articlesObj);
        setData(articlesArray);
      }
    });

    // Cleanup khi component bị unmount
    return () => {
      // Hủy đăng ký sự kiện
      off(articlesRef);
    };
  }, []);

  // Lọc dữ liệu dựa trên chuyên mục được chọn
  const filteredData =
    selectedCategory === "Tất cả"
      ? data
      : data.filter((item) => item.categoryName === selectedCategory);

  // Chuyển đổi định dạng ngày và số lượt xem
  const dates = filteredData.map((item) =>
    format(new Date(item.publish_time), "yyyy-MM-dd")
  );
  const views = filteredData.map((item) =>
    Number(item.pageview || item.views || 0)
  );

  // Thống kê số lượng bài viết theo ngày
  const articlesByDate = _.groupBy(filteredData, (item) =>
    format(new Date(item.publish_time), "yyyy-MM-dd")
  );

  const dateKeys = Object.keys(articlesByDate).sort();
  const countsByDate = dateKeys.map((date) => articlesByDate[date].length);

  // Thống kê số bài viết theo chuyên mục
  const categoryCounts = {};
  data.forEach((item) => {
    const category = item.categoryName || "Không rõ";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  // Thống kê top N chuyên mục được quan tâm
  const categoryViews = {};
  data.forEach((item) => {
    const category = item.categoryName || "Không rõ";
    const viewCount = Number(item.pageview || item.views || 0);
    categoryViews[category] = (categoryViews[category] || 0) + viewCount;
  });

  const sortedCategoryViews = Object.entries(categoryViews).sort(
    (a, b) => b[1] - a[1]
  );
  const topCategories = sortedCategoryViews.slice(0, topN);

  // Thống kê top N bài viết có lượt xem cao nhất
  const sortedArticles = data
    .filter((item) => (item.pageview || item.views) && item.title)
    .sort(
      (a, b) =>
        Number(b.pageview || b.views || 0) - Number(a.pageview || a.views || 0)
    )
    .slice(0, topN);

  // Sắp xếp các bài đăng gần đây nhất
  const sortedRecentPosts = data
    .filter((item) => item.publish_time)
    .sort((a, b) => b.publish_time - a.publish_time)
    .slice(0, recentPostsCount);

  // Tổng hợp từ khóa và số lần xuất hiện
  const allKeywordCounts = {};
  data.forEach((item) => {
    const keywords = item.keywords || [];
    keywords.forEach((keyword) => {
      allKeywordCounts[keyword] = (allKeywordCounts[keyword] || 0) + 1;
    });
  });

  // Chuẩn bị dữ liệu cho word cloud
  const words = Object.entries(allKeywordCounts).map(([text, value]) => ({
    name: text,
    value,
  }));

  // Chọn một số từ khóa quan trọng (ví dụ: top 10)
  const sortedKeywords = Object.entries(allKeywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const importantKeywords = sortedKeywords.map(([keyword]) => keyword);

  // Chuẩn bị dữ liệu cho biểu đồ số lần từ khóa được nhắc đến theo thời gian
  const keywordData = importantKeywords.map((keyword) => {
    const keywordCountsByDate = {};
    data.forEach((item) => {
      const date = format(new Date(item.publish_time), "yyyy-MM-dd");
      const count = item.keywordCounts ? item.keywordCounts[keyword] || 0 : 0;
      keywordCountsByDate[date] = (keywordCountsByDate[date] || 0) + count;
    });
    return {
      x: dateKeys,
      y: dateKeys.map((date) => keywordCountsByDate[date] || 0),
      type: "scatter",
      mode: "lines+markers",
      name: keyword,
    };
  });

  // Phân tích cảm xúc
  const positiveArticles = data.filter((item) => item.sentimentScore > 0);
  const negativeArticles = data.filter((item) => item.sentimentScore < 0);
  const neutralArticles = data.filter((item) => item.sentimentScore === 0);

  // Sử dụng Sentiment để phân tích cảm xúc tiêu đề (để sử dụng biến Sentiment)
  const sentiment = new Sentiment();
  data.forEach((item) => {
    const result = sentiment.analyze(item.title || "");
    item.titleSentimentScore = result.score;
  });

  // Tính điểm cảm xúc tiêu đề trung bình theo ngày
  const titleSentimentByDate = {};
  data.forEach((item) => {
    const date = format(new Date(item.publish_time), "yyyy-MM-dd");
    const sentimentScore = item.titleSentimentScore || 0;
    if (!titleSentimentByDate[date]) {
      titleSentimentByDate[date] = { totalSentiment: 0, count: 0 };
    }
    titleSentimentByDate[date].totalSentiment += sentimentScore;
    titleSentimentByDate[date].count += 1;
  });

  const averageTitleSentimentByDate = dateKeys.map((date) => {
    const { totalSentiment, count } = titleSentimentByDate[date] || {
      totalSentiment: 0,
      count: 0,
    };
    return count > 0 ? totalSentiment / count : 0;
  });

  // Dữ liệu cho biểu đồ Chart.js
  const lineChartData = {
    labels: dateKeys,
    datasets: [
      {
        label: "Điểm cảm xúc tiêu đề trung bình",
        data: averageTitleSentimentByDate,
        fill: false,
        borderColor: "red",
      },
    ],
  };

  const lineChartOptions = {
    scales: {
      x: {
        type: "category",
        title: {
          display: true,
          text: "Ngày",
        },
      },
      y: {
        title: {
          display: true,
          text: "Điểm cảm xúc",
        },
      },
    },
  };

  // Khởi tạo biểu đồ word cloud
  useEffect(() => {
    const chartDom = document.getElementById("word-cloud");
    if (chartDom) {
      const myChart = echarts.init(chartDom);
      const option = {
        tooltip: {},
        series: [
          {
            type: "wordCloud",
            shape: "circle",
            left: "center",
            top: "center",
            width: "100%",
            height: "100%",
            sizeRange: [10, 60],
            rotationRange: [-90, 90],
            rotationStep: 45,
            gridSize: 8,
            drawOutOfBound: false,
            layoutAnimation: true,
            textStyle: {
              fontFamily: "sans-serif",
              fontWeight: "bold",
              color: () => {
                return (
                  "rgb(" +
                  [
                    Math.round(Math.random() * 160),
                    Math.round(Math.random() * 160),
                    Math.round(Math.random() * 160),
                  ].join(",") +
                  ")"
                );
              },
            },
            emphasis: {
              focus: "self",
              textStyle: {
                textShadowBlur: 10,
                textShadowColor: "#333",
              },
            },
            data: words,
          },
        ],
      };
      myChart.setOption(option);

      // Dọn dẹp khi component bị unmount
      return () => {
        myChart.dispose();
      };
    }
  }, [words]);

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
          {["Tất cả", ...Object.keys(categoryCounts)].map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Dropdown chọn top N */}
      <div className="filter">
        <label htmlFor="topN">Chọn số lượng top N: </label>
        <select
          id="topN"
          value={topN}
          onChange={(e) => setTopN(Number(e.target.value))}
        >
          {[5, 10, 15, 20].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Input số lượng bài đăng gần đây */}
      <div className="filter">
        <label htmlFor="recentPostsCount">
          Số lượng bài đăng gần đây muốn hiển thị:{" "}
        </label>
        <input
          type="number"
          id="recentPostsCount"
          value={recentPostsCount}
          onChange={(e) => setRecentPostsCount(Number(e.target.value))}
          min="1"
        />
      </div>

      {/* Biểu đồ số lượng bài viết theo ngày */}
      <div className="chart">
        <Plot
          data={[
            {
              x: dateKeys,
              y: countsByDate,
              type: "bar",
              marker: { color: "blue" },
            },
          ]}
          layout={{
            title: "Số lượng bài viết theo ngày",
            xaxis: { title: "Ngày" },
            yaxis: { title: "Số lượng bài viết" },
          }}
        />
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
              marker: { color: "green" },
            },
          ]}
          layout={{
            title: "Lượt xem theo thời gian",
            xaxis: { title: "Thời gian" },
            yaxis: { title: "Lượt xem" },
          }}
        />
      </div>

      {/* Biểu đồ top N chuyên mục được quan tâm */}
      <div className="chart">
        <Plot
          data={[
            {
              x: topCategories.map((c) => c[0]),
              y: topCategories.map((c) => c[1]),
              type: "bar",
              marker: { color: "purple" },
            },
          ]}
          layout={{
            title: `Top ${topN} chuyên mục được quan tâm`,
            xaxis: { title: "Chuyên mục" },
            yaxis: { title: "Tổng lượt xem" },
          }}
        />
      </div>

      {/* Biểu đồ top N bài viết có lượt xem cao nhất */}
      <div className="chart">
        <Plot
          data={[
            {
              x: sortedArticles.map((item) => item.title),
              y: sortedArticles.map((item) =>
                Number(item.pageview || item.views || 0)
              ),
              type: "bar",
              marker: { color: "orange" },
            },
          ]}
          layout={{
            title: `Top ${topN} bài viết có lượt xem cao nhất`,
            xaxis: { title: "Tiêu đề bài viết" },
            yaxis: { title: "Lượt xem" },
          }}
        />
      </div>

      {/* Word Cloud các từ khóa quan trọng */}
      <div className="chart">
        <h2>Word Cloud các từ khóa quan trọng</h2>
        <div id="word-cloud" style={{ width: "100%", height: "400px" }}></div>
      </div>

      {/* Biểu đồ số lần từ khóa được nhắc đến theo thời gian */}
      <div className="chart">
        <Plot
          data={keywordData}
          layout={{
            title: "Số lần từ khóa được nhắc đến theo thời gian",
            xaxis: { title: "Ngày" },
            yaxis: { title: "Số lần nhắc đến" },
          }}
        />
      </div>

      {/* Biểu đồ tỷ lệ bài viết theo cảm xúc */}
      <div className="chart">
        <Plot
          data={[
            {
              values: [
                positiveArticles.length,
                negativeArticles.length,
                neutralArticles.length,
              ],
              labels: ["Tích cực", "Tiêu cực", "Trung tính"],
              type: "pie",
            },
          ]}
          layout={{
            title: "Tỷ lệ bài viết theo cảm xúc",
          }}
        />
      </div>

      {/* Biểu đồ điểm cảm xúc tiêu đề trung bình theo ngày (sử dụng Chart.js) */}
      <div className="chart">
        <h2>Điểm cảm xúc tiêu đề trung bình theo ngày</h2>
        <Line data={lineChartData} options={lineChartOptions} />
      </div>

      {/* Danh sách các bài đăng gần đây nhất */}
      <div className="recent-posts">
        <h2>Các bài đăng gần đây nhất</h2>
        <ul>
          {sortedRecentPosts.map((post, index) => (
            <li key={index}>
              <h3>{post.title}</h3>
              <p>Chuyên mục: {post.categoryName}</p>
              <p>Lượt xem: {post.pageview || post.views || 0}</p>
              <p>
                Thời gian đăng:{" "}
                {format(new Date(post.publish_time), "dd/MM/yyyy HH:mm")}
              </p>
              <a href={post.url} target="_blank" rel="noopener noreferrer">
                Xem chi tiết
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DataVisualization;
