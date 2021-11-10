const fwalker = require('fwalker');
const del = require('del');
const fs = require('fs');
const path = require('path');
const hljs = require('highlight.js');

const createHash = require('crypto').createHash;


const in_folder = './example-in';
const out_folder = './example-out';


function streamToString (stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    })
  }


const options = {
    maxPending: 10, // throttle handles
  };



del.sync([out_folder]);
fwalker(in_folder, options)
  .on('dir', function(p) {
    // console.log('dir:  %s', p);
    fs.mkdirSync(path.resolve(out_folder, p));

    const links = []

    fs.readdir(path.resolve(in_folder, p), { withFileTypes: true } ,(err, files) => {
        const links = files.map((entry)=>{
            if(entry.isDirectory()){
                return `<a href="./${entry.name}">${entry.name}/</a></br>`
            }else if(entry.isFile()){
                return `<a href="./${entry.name}.html">${entry.name}</a></br>`
            }            
        });
        const content = `
            <html>
            <body>
                <a href="..">..</a></br>
                ${links.join()}
            </body>
            </html>
        `
        fs.writeFile(path.resolve(out_folder,p, `index.html`), content, err => {
            if (err) {
              console.error(err);
              return
            }
        })
      });
  })
  .on('stream', async function(rs, p, s, fullPath) {
    const code = await streamToString(rs);
    const html = hljs.highlightAuto('\n'+code).value;
    const output = `
    <html>
    <head>
      <title>${fullPath}</title>
      <link rel="stylesheet" href="https://highlightjs.org/static/demo/styles/qtcreator-light.css">
    </head>
    <body>
    <pre>
    <code>${html}</code>
    </pre>
    </body>
  
    </html>
    `;  
    // console.log(p);
    // console.log(path.resolve(out_folder, `${p}.html`));  
   
    fs.writeFile(path.resolve(out_folder, `${p}.html`), output, err => {
        if (err) {
          console.error(err);
          return
        }
    });
  })
  .on('file', function(p, s) {
    console.log('file: %s, %d bytes', p, s.size);
  })
  .on('error', function(err) {
    console.error(err);
  })
  .on('done', function() {
    console.log('%d dirs, %d files, %d bytes', this.dirs, this.files, this.bytes);
  })
.walk();