# [Minimum Size Subarray Sum](https://leetcode.cn/problems/minimum-size-subarray-sum/)



LeetCode 209.**Minimum Size Subarray Sum**

Given an array of positive integers `nums` and a positive integer `target`, return *the **minimal length** of a* *subarray* *whose sum is greater than or equal to* `target`. If there is no such subarray, return `0` instead.



tips: Slip-windows(滑动窗口)



My Answer:

```c++
class Solution {
public:
    int minSubArrayLen(int target, vector<int>& nums) {
        int minSize = 0, subSum = 0, j = 0;
        for(int i = 0 ;i < nums.size();i++){
            subSum = subSum + nums[i];

            while(subSum >= target){
                if(i - j + 1 < minSize || minSize == 0 ){
                    minSize = i - j + 1;
                }
                subSum = subSum - nums[j];
                j++;
            }
        }

        return minSize;
    }
};
```

