
const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3({ region: 'us-east-1' }); // Specify your desired AWS region

function uploadFileToS3(bucketName, fileName, fileContent) {
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileContent,
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.Location);
      }
    });
  });
}

module.exports = { uploadFileToS3 };
