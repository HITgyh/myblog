# [Remove Nth Node From End of List](https://leetcode.cn/problems/remove-nth-node-from-end-of-list/)



LeetCode 19.**Remove Nth Node From End of List**

Given the `head` of a linked list, remove the `nth` node from the end of the list and return its head.



My Answer;

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
    int getLength(ListNode *head){
        int i = 0;
        ListNode *p = head;
        while(p){
            i++;
            p = p->next;
        }
        return i;
        
    }
    ListNode* removeNthFromEnd(ListNode* head, int n) {
        int L = getLength(head);
        ListNode *DummyNode = new ListNode(0);
        DummyNode->next = head;
        ListNode *p = DummyNode;
        for(int i = 1; i<L-n+1;i++){
            p=p->next;
        }
        ListNode *q = p->next;
        p->next = q->next;
        delete q;
        return DummyNode->next;
    }
};
```

