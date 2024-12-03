// backend/crawler.js
const axios = require("axios");
const db = require("./firebase");
const cheerio = require("cheerio");
const OpenAI = require("openai");
require("dotenv").config();

// Thay thế 'YOUR_OPENAI_API_KEY' bằng API Key của bạn
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Hàm lấy nội dung bài viết từ URL
async function fetchArticleContent(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // Lấy tiêu đề bài viết
    const title = $("h1.kbwc-title").text().trim();

    // Lấy meta description
    const metaDescription = $('meta[name="description"]').attr("content") || "";

    // Lấy tất cả các đoạn văn trong thẻ <p> của .klw-new-content
    const contentParagraphs = $(".klw-new-content p")
      .map((i, el) => $(el).text().trim())
      .get()
      .filter((text) => text.length > 0);

    // Ghép các đoạn văn thành một chuỗi nội dung
    const content = contentParagraphs.join(" ");

    // Kết hợp tiêu đề, meta description và nội dung bài viết
    const fullContent = `${title}\n${metaDescription}\n${content}`;

    return {
      title,
      metaDescription,
      content,
      fullContent,
    };
  } catch (error) {
    console.error(`Lỗi khi lấy nội dung từ URL: ${url}`, error.message);
    return {
      title: "",
      metaDescription: "",
      content: "",
      fullContent: "",
    };
  }
}

// Hàm trích xuất từ khóa từ nội dung sử dụng GPT-4
async function extractKeywordsUsingGPT(content) {
  try {
    const prompt = `Trích xuất các từ khóa chính từ đoạn văn sau dưới dạng một mảng JSON các chuỗi (không giải thích thêm):

${content}

Các từ khóa:`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 150,
      temperature: 0.3,
      n: 1,
    });

    const keywordsText = response.choices[0].message.content.trim();

    let keywords = [];
    try {
      keywords = JSON.parse(keywordsText);
    } catch (e) {
      keywords = keywordsText.split(",").map((kw) => kw.trim());
    }

    return keywords;
  } catch (error) {
    console.error("Lỗi khi sử dụng GPT để trích xuất từ khóa:", error.message);
    return [];
  }
}

// Hàm chính để cào dữ liệu từ Kenh14
const crawlKenh14 = async () => {
  try {
    // Gọi API để lấy danh sách 1000 bài viết gần nhất
    const apiUrl =
      "https://rec.aiservice.vn/recengine/prod/admicro/recgate/api/v1/recommender?customerid=4465c75414aee7bb&boxid=8&dg=030a82fb30eea055839313e07711e2c8&extr=eyJjciI6IjE3MzIyNTIyNjciLCJsYyI6IjMxIiwicGdsaWQiOjE3MzIyNTM4MzMwNTksInR5cGUiOiJwYyJ9&uid=&itemid=&deviceid=5832252267247460216&template=1000&refresh=1&limit=1000&vieweditems=[]";

    const response = await axios.get(apiUrl);
    const articlesList = response.data.recommend; // Đây là mảng các bài viết

    if (!articlesList || articlesList.length === 0) {
      console.log("Không có bài viết nào được trả về từ API.");
      return;
    }

    // Lấy dữ liệu hiện có từ Firebase
    const articlesRef = db.ref("articles");
    const existingArticlesSnapshot = await articlesRef.once("value");
    const existingArticles = existingArticlesSnapshot.val() || {};

    let newArticlesCount = 0;
    let updatedArticlesCount = 0;

    // Lặp qua danh sách bài viết
    for (const article of articlesList) {
      const articleId = article.id;

      // Kiểm tra xem bài viết đã tồn tại trong Firebase chưa
      if (existingArticles[articleId]) {
        // Bài viết đã tồn tại, bỏ qua hoặc cập nhật nếu cần
        continue;
      }

      // Lấy nội dung bài viết
      const { title, metaDescription, content, fullContent } =
        await fetchArticleContent(article.url);

      // Trích xuất từ khóa sử dụng GPT-4
      const keywords = await extractKeywordsUsingGPT(fullContent);

      // Tính toán tần suất xuất hiện của từng từ khóa
      const keywordCounts = {};
      keywords.forEach((keyword) => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      });

      // Thêm các thông tin mới vào bài viết
      article.title = title;
      article.metaDescription = metaDescription;
      article.content = content;
      article.keywords = keywords;
      article.keywordCounts = keywordCounts;

      // Chuyển đổi publish_time sang định dạng ngày tháng cụ thể
      article.publish_time_formatted = new Date(
        article.publish_time
      ).toISOString();

      // Thêm vào danh sách bài viết mới
      existingArticles[articleId] = article;
      newArticlesCount++;
    }

    // Lưu dữ liệu cập nhật vào Firebase
    await articlesRef.set(existingArticles);

    console.log(
      `Đã thêm ${newArticlesCount} bài viết mới và cập nhật ${updatedArticlesCount} bài viết.`
    );

    // Lưu lại thời gian cào dữ liệu
    const lastCrawlRef = db.ref("lastCrawlTime");
    await lastCrawlRef.set(new Date().toISOString());
  } catch (error) {
    console.error("Lỗi khi cào dữ liệu:", error.message);
  }
};

module.exports = crawlKenh14;
