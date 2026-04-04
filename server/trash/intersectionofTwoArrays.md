# 349. [Intersection of Two Arrays](https://leetcode.cn/problems/intersection-of-two-arrays/)



Given two integer arrays `nums1` and `nums2`, return *an array of their intersection*. Each element in the result must be **unique** and you may return the result in **any order**.



JavaScript

```javascript
/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number[]}
 */

var intersection = function(nums1, nums2) {
    
    const set1 = new Set(nums1);
    const set2 = new Set(nums2);
    const interSection = new Set();

    if(set1.size > set2.size){
        for( const num of set2){
            if(set1.has(num)){
                interSection.add(num);
            }
        }
    }else{
        for(const num of set1){
            if(set2.has(num)){
                interSection.add(num);
            }
        }
    }
    
    return [...interSection];
};
```

