const fs = require('fs');
const path = require('path');
const gTTS = require('node-gtts')('vi');
const { v4: uuidv4 } = require('uuid');

// Tạo thư mục output nếu chưa tồn tại
const outputDir = path.join(__dirname, '../../public/output');
console.log('Output directory:', outputDir);

if (!fs.existsSync(outputDir)) {
  console.log('Creating output directory');
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Xóa các file audio cũ và chỉ giữ lại maxFilesToKeep file gần nhất
 * @param {string} directory - Thư mục chứa file audio
 * @param {number} maxFilesToKeep - Số lượng file tối đa muốn giữ lại
 */
const cleanupOldAudioFiles = async (directory, maxFilesToKeep = 2) => {
  try {
    // Đọc tất cả các file trong thư mục
    const files = fs.readdirSync(directory);
    
    // Lọc chỉ lấy file .mp3
    const audioFiles = files.filter(file => file.toLowerCase().endsWith('.mp3'));
    
    // Nếu số lượng file audio ít hơn hoặc bằng số lượng cần giữ lại, không cần xóa
    if (audioFiles.length <= maxFilesToKeep) {
      return;
    }
    
    // Lấy thông tin để sắp xếp theo thời gian sửa đổi
    const fileStats = audioFiles.map(file => {
      const filePath = path.join(directory, file);
      return {
        name: file,
        path: filePath,
        mtime: fs.statSync(filePath).mtime.getTime()
      };
    });
    
    // Sắp xếp file theo thời gian giảm dần (mới nhất đầu tiên)
    fileStats.sort((a, b) => b.mtime - a.mtime);
    
    // Lấy các file cần xóa (bỏ qua maxFilesToKeep file đầu tiên)
    const filesToDelete = fileStats.slice(maxFilesToKeep);
    
    // Xóa từng file
    for (const file of filesToDelete) {
      fs.unlinkSync(file.path);
    }
    
  } catch (error) {
    console.error('Error cleaning up old audio files:', error);
  }
};

/**
 * Chuyển văn bản thành giọng nói
 */
const textToSpeech = async (req, res) => {
  try {
    const { text, voiceType } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu nội dung văn bản' 
      });
    }

    // Sử dụng văn bản gốc, không xử lý thêm
    const processedText = text;

    const outputFile = `speech-${uuidv4()}.mp3`;
    const outputPath = path.join(outputDir, outputFile);

    // Sử dụng Promise để xử lý callback
    await new Promise((resolve, reject) => {
      gTTS.save(outputPath, processedText, (err) => {
        if (err) {
          console.error('Error saving audio file:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
    
    // Sau khi lưu file thành công, dọn dẹp các file cũ
    await cleanupOldAudioFiles(outputDir, 2);
    
    // Đường dẫn phải bắt đầu với /public để phù hợp với cấu hình static folder
    const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
    const audioUrl = `${serverUrl}/public/output/${outputFile}`;
    
    // Trả về đường dẫn file tương đối với thư mục public
    res.json({ 
      success: true, 
      audioUrl: audioUrl
    });
  } catch (error) {
    console.error('Error in textToSpeech controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi chuyển đổi văn bản thành giọng nói',
      error: error.message 
    });
  }
};

// Lấy danh sách giọng nói có sẵn
const getAvailableVoices = (req, res) => {
  try {
    // Chỉ giữ lại giọng bình thường
    const voices = [
      { id: 'normal', name: 'Giọng bình thường', language: 'vi-VN' }
    ];
    
    res.json({
      success: true,
      voices
    });
  } catch (error) {
    console.error('Error in getAvailableVoices controller:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách giọng nói',
      error: error.message
    });
  }
};

module.exports = {
  textToSpeech,
  getAvailableVoices
}; 