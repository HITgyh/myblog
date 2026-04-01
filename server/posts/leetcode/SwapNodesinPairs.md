# [Swap Nodes in Pairs](https://leetcode.cn/problems/swap-nodes-in-pairs/)



LeetCode 24.**Swap Nodes in Pairs**

Given a linked list, swap every two adjacent nodes and return its head. You must solve the problem without modifying the values in the list's nodes (i.e., only nodes themselves may be changed.)



My Answer:

```c++
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* swapPairs(ListNode* head) {
        ListNode *DummyHead = new ListNode(0);
        DummyHead->next = head;
        ListNode *pre = DummyHead;
        ListNode *p = head;
        ListNode *q,*last;
        if(head){
            q = head->next;
        }else{
            return head;
        }
        if(head->next){
            last = head->next->next;
        }else{
            return head;
        }
        while(1){
            pre->next = q;
            p->next = last;
            q->next = p;

            pre = p;
            p = last;
            if(last){
                q = last->next;
            }else{
                return DummyHead->next;
            }
            if(q){
                last = q->next;
            }else{
                return DummyHead->next;
            }
        }
        

    }
};
```

