# [Spiral Matrix II](https://leetcode.cn/problems/spiral-matrix-ii/)



LeetCode 59.Spiral Matrix II

Given a positive integer `n`, generate an `n x n` `matrix` filled with elements from `1` to `n2` in spiral order.



My Answer:

```C++
class Solution {
public:
    vector<vector<int>> generateMatrix(int n) {
        vector<vector<int>> res(n,vector<int>(n,0));
        int i = 0,j = 0,x = 1,temp = 0,m = n;
        while(m>=0){
            while(j<n-1-temp) res[i][j++] = x++;
            while(i<n-1-temp) res[i++][j] = x++;
            while(j>temp) res[i][j--] = x++;
            while(i>temp) res[i--][j] = x++;
            i++;j++;temp++;
            m = m - 2;
        }
        if(m == -1) res[--i][--j] = x;
        return res;
    }
};
```

