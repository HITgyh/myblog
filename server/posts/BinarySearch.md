# [Binary Search](https://leetcode.cn/problems/binary-search/)



LeetCode **704.binary search**

Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.

You must write an algorithm with `O(log n)` runtime complexity.



My Answer：

```c++
class Solution {
public:
    int search(vector<int>& nums, int target) {
        int left = 0, right = nums.size()-1;
        while(left<=right){
            int temp = left + (right - left)/2;//防止溢出
            if(nums[temp] == target) return temp;
            if(nums[temp] > target){
                right = temp - 1;
            }else if(nums[temp] < target){
                left = temp + 1;
            }
        }

        return -1;
    }
};
```



JavaScript

```
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var search = function(nums, target) {
    var left = 0,right = nums.length - 1;
    while(left <= right){
        var mid = Math.floor((right - left)/2) + left;
        const num = nums[mid];
        if(num == target){
            return mid;
        }else if(num < target){
            left = mid + 1;
        }else if(num > target){
            right = mid - 1;
        }
    }

    return -1;
};
```

