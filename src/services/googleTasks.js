/**
 * Google Tasks API — thật.
 *
 * Dùng cho việc nhắc con cái đi mua thuốc trước khi hết. Đây là loại việc
 * đúng kiểu Tasks: có deadline, cần tích xong, không cần chiếm chỗ trên lịch.
 */

import { googleApiFetch } from './googleAuth';

const TASKS_BASE = 'https://tasks.googleapis.com/tasks/v1';

/** Lấy danh sách task mặc định của tài khoản */
export async function getDefaultTaskList() {
  const res = await googleApiFetch(`${TASKS_BASE}/users/@me/lists?maxResults=1`);
  if (!res.ok) return res;

  const list = res.data.items?.[0];
  if (!list) {
    return {
      ok: false,
      error_code: 'NO_TASK_LIST',
      error_message: 'Tài khoản Google này chưa có danh sách Việc cần làm nào.'
    };
  }
  return { ok: true, id: list.id, title: list.title };
}

/**
 * Tạo việc mua thêm thuốc.
 *
 * Lưu ý về API Tasks: trường `due` chỉ nhận ngày (phần giờ bị Google bỏ qua),
 * nên không đặt được giờ nhắc chính xác — đó là giới hạn của chính API,
 * không phải lỗi ở đây.
 */
export async function createRefillTask({
  medicationName,
  remainingDays = 5,
  memberName,
  taskListId = null,
  includeMedName = false
}) {
  let listId = taskListId;
  if (!listId) {
    const listRes = await getDefaultTaskList();
    if (!listRes.ok) return listRes;
    listId = listRes.id;
  }

  const due = new Date(Date.now() + remainingDays * 86400000);
  due.setHours(0, 0, 0, 0);

  const label = includeMedName ? medicationName : 'thuốc';

  const res = await googleApiFetch(`${TASKS_BASE}/lists/${encodeURIComponent(listId)}/tasks`, {
    method: 'POST',
    body: JSON.stringify({
      title: `🛒 Mua thêm ${label} cho ${memberName}`,
      notes: [
        includeMedName ? `Thuốc: ${medicationName}` : 'Xem tên thuốc trong app Nhà Mình.',
        `Ước tính còn khoảng ${remainingDays} ngày.`,
        '',
        'Tạo bởi app Nhà Mình.'
      ].join('\n'),
      due: due.toISOString()
    })
  });

  if (!res.ok) return res;

  return {
    ok: true,
    task_id: res.data.id,
    title: res.data.title,
    due: res.data.due,
    list_id: listId
  };
}

export async function listAiriserTasks(taskListId = null) {
  let listId = taskListId;
  if (!listId) {
    const listRes = await getDefaultTaskList();
    if (!listRes.ok) return listRes;
    listId = listRes.id;
  }

  const res = await googleApiFetch(`${TASKS_BASE}/lists/${encodeURIComponent(listId)}/tasks?showCompleted=false`);
  if (!res.ok) return res;

  return {
    ok: true,
    tasks: (res.data.items || [])
      // Nhận cả tên cũ "Sức Khỏe Nhà": task tạo trước lần đổi tên vẫn phải
      // tìm lại được, nếu không người dùng sẽ thấy nhắc trùng trong Google Tasks.
      .filter(t => {
        const notes = t.notes || '';
        return notes.includes('Nhà Mình') || notes.includes('Sức Khỏe Nhà');
      })
      .map(t => ({ id: t.id, title: t.title, due: t.due, status: t.status }))
  };
}

export async function completeTask(taskId, taskListId) {
  return googleApiFetch(`${TASKS_BASE}/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'completed' })
  });
}

/** Kiểm tra kết nối Tasks */
export async function testTasksConnection() {
  const res = await getDefaultTaskList();
  if (!res.ok) return res;
  return { ok: true, list_title: res.title };
}
