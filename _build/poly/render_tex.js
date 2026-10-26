// reads JSON array of {tex, display} from stdin, writes JSON array of HTML strings
const katex = require('katex');
let buf=''; process.stdin.on('data',d=>buf+=d); process.stdin.on('end',()=>{
  const items=JSON.parse(buf);
  const out=items.map(it=>katex.renderToString(it.tex,{throwOnError:true,displayMode:!!it.display,output:'htmlAndMathml',strict:'warn'}));
  process.stdout.write(JSON.stringify(out));
});
