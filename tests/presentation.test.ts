import test from 'node:test';
import assert from 'node:assert/strict';
import { presentationFromQuery } from '../src/presentation';
test('all supported language and theme combinations are accepted',()=>{
 for(const language of ['en','ar'])for(const theme of ['light','dark'])
 assert.deepEqual(presentationFromQuery(`?portfolio_lang=${language}&portfolio_theme=${theme}`),{language,theme});
});
test('invalid and missing values retain independent local defaults',()=>{
 assert.deepEqual(presentationFromQuery('?portfolio_lang=xx&portfolio_theme=blue'),{language:undefined,theme:undefined});
 assert.deepEqual(presentationFromQuery('?portfolio_lang=ar'),{language:'ar',theme:undefined});
});
