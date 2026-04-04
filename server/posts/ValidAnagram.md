# 242.Valid Angaram



Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.



JavaScript

```javascript
var isAnagram = function(s, t) {
    return s.length == t.length && [...s].sort().join('') == [...t].sort().join('');
};
```



```javascript
/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
var isAnagram = function(s, t) {
    if(s.length != t.length) return false;
    const table = new Array(26).fill(0);
    for(let i = 0;i<s.length;i++){
        table[s.codePointAt(i)-'a'.codePointAt(0)]++;
    }
    for(let i = 0;i<t.length;i++){
        table[t.codePointAt(i)-'a'.codePointAt(0)]--;
        if(table[t.codePointAt(i)-'a'.codePointAt(0)]<0){
            return false;
        }
    }
    return true;
};
```

