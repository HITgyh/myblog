# [Remove Linked List Elements](https://leetcode.cn/problems/remove-linked-list-elements/)



LeetCode 203.**Remove Linked List Elements**

Given the `head` of a linked list and an integer `val`, remove all the nodes of the linked list that has `Node.val == val`, and return *the new head*.



My Answer:

```c++
class Solution {
public:
    ListNode* removeElements(ListNode* head, int val) {
        while(head!=NULL&&head->val==val){
            ListNode *temp = head;
            head = head->next;
            delete temp;
        }
        ListNode *p = head;
        while(p!=NULL&&p->next!=NULL){
            if(p->next->val==val){
                ListNode *temp = p->next;
                p->next = temp->next;
                delete temp;
            }else{
                p = p->next;
            }
        }
        return head;
    }
};
```



JavaScript

```javascript
/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @param {number} val
 * @return {ListNode}
 */
var removeElements = function(head, val) {
    const dummyNode = new ListNode();
    dummyNode.next = head;
    var p = dummyNode;
    while(p.next != null){
        if(p.next.val == val){
            p.next = p.next.next;
        }else{
            p = p.next;
        }
    }
    return dummyNode.next;
};
```

