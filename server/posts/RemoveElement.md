# [Remove Element](https://leetcode.cn/problems/remove-element/)



The brute-force solution for this problem involves utilizing two for loops. The first for loop iterates through the elements of the array, while the second for loop updates the array. Now we choose to use fast and slow pointers which can accomplish this within one for loop.



LeetCode 27.**Remove Element**



Given an integer array `nums` and an integer `val`, remove all occurrences of `val` in `nums` [**in-place**](https://en.wikipedia.org/wiki/In-place_algorithm). The order of the elements may be changed. Then return *the number of elements in* `nums` *which are not equal to* `val`.

Consider the number of elements in `nums` which are not equal to `val` be `k`, to get accepted, you need to do the following things:

- Change the array `nums` such that the first `k` elements of `nums` contain the elements which are not equal to `val`. The remaining elements of `nums` are not important as well as the size of `nums`.
- Return `k`.



My Answer:

```c++
class Solution {
public:
    int removeElement(vector<int>& nums, int val) {
        int slow = 0;
        for( int fast = 0;fast < nums.size();fast++){
            if(nums[fast] != val){
                nums[slow] = nums[fast];
                slow++;
            }
        }
        return slow;
    }
};
```



Javascript

```javascript
/**
 * @param {number[]} nums
 * @param {number} val
 * @return {number}
 */
var removeElement = function(nums, val) {
    var left = 0, right = nums.length - 1;
    while(left <= right){
        
        while(nums[right] == val && right > left){
            nums[right] = null;
            right--;
            
        }
        
        while(nums[left] != val && right > left) {
            left++;
        }
        if(right < left) break;
        if(right == left){
            if(nums[left]==val){
                nums[left] = null;
            }else{
                left++;
                
            }
            break;
        }
        nums[left] = nums[right];
        nums[right] = null;
        left++;right--;
    }
    return left;
};
```

