# [Squares of a Sorted Array](https://leetcode.cn/problems/squares-of-a-sorted-array/)



LeetCode 977.**Square of a Sorted Array**

Given an integer array `nums` sorted in **non-decreasing** order, return *an array of **the squares of each number** sorted in non-decreasing order*.



My Answer:

```c++
class Solution {
public:
    vector<int> sortedSquares(vector<int>& nums) {
        int left = 0,right = nums.size();
        vector<int> ans(right);
        right--;
        for(int i = right;i>=0;i--){
            if(nums[right] + nums[left] >= 0){
                ans[i] = nums[right] * nums[right];
                right--;
            }else{
                ans[i] = nums[left] * nums[left];
                left++;
            }
        }

        return ans;
    }
};
```



javaScript

```javascript
/**
 * @param {number[]} nums
 * @return {number[]}
 */
var sortedSquares = function(nums) {
    let ans = [];
    for(let num of nums){
        ans.push(num * num);
    }
    ans.sort((a, b)=>a-b);
    return ans;
};

```



```javascript
/**
 * @param {number[]} nums
 * @return {number[]}
 */
var sortedSquares = function(nums) {
    for(var i = 0;i<nums.length;i++){
        if(nums[i]<0){
            nums[i] = 0 - nums[i];
        }else{
            break;
        }
    }
    insertSort(nums);
    for(var i = 0; i < nums.length;i++){
        nums[i] = nums[i] * nums[i];
    }
    
    return nums;
};
 function insertSort(arr){

    for(var i = 1;i<arr.length;i++){
        var temp = arr[i];
        var j = i - 1;
        while(arr[j] > temp && j>=0){
            arr[j+1] = arr[j];
            j = j - 1;
        }
        arr[j+1] = temp;
    }
}
```



数组的升序排列

```javascript
ans.sort((a,b) => a - b);
//完整写法
ans.sort(function(a,b){
	return a-b;
});
```



简单的循环

```javascript
for(let num of nums)....
```

