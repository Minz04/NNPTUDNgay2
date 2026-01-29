// Lưu ý: Để fetch db.json bằng fetch, bạn cần chạy server local (không mở file trực tiếp bằng file://)
let products = [];
let categories = [];
let filteredProducts = [];
let sortType = '';
let searchText = '';
let currentPage = 1;
const pageSize = 15;

function getCategoryListFromProducts(products) {
  const map = {};
  products.forEach(p => {
    if (p.category && p.category.id && p.category.name) {
      map[p.category.id] = { ...p.category };
    }
  });
  return Object.values(map);
}

// Fetch dữ liệu và khởi tạo
fetch('db.json')
  .then(res => res.json())
  .then(data => {
    products = data;
    categories = getCategoryListFromProducts(products);
    renderCategoryOptions();
    renderCategoryList();
    renderTable();
  })
  .catch(err => {
    document.getElementById('product-list').textContent = 'Lỗi khi tải dữ liệu sản phẩm.';
    console.error(err);
  });

// Tìm kiếm
function onSearchChanged() {
  searchText = document.getElementById('searchInput').value.trim().toLowerCase();
  currentPage = 1;
  renderTable();
}

// Sắp xếp
function sortBy(type) {
  sortType = type;
  currentPage = 1;
  renderTable();
}

// Render bảng sản phẩm và phân trang
function renderTable() {
  let arr = products.slice();
  // Lọc theo tên
  if (searchText) {
    arr = arr.filter(p => p.title.toLowerCase().includes(searchText));
  }
  // Sắp xếp
  if (sortType === 'name') {
    arr.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortType === 'priceAsc') {
    arr.sort((a, b) => a.price - b.price);
  } else if (sortType === 'priceDesc') {
    arr.sort((a, b) => b.price - a.price);
  } else if (sortType === 'category') {
    arr.sort((a, b) => (a.category?.name || '').localeCompare(b.category?.name || ''));
  }
  filteredProducts = arr;

  // Phân trang
  const total = arr.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  const startIdx = (currentPage - 1) * pageSize;
  const pageProducts = arr.slice(startIdx, startIdx + pageSize);

  const tbody = document.getElementById('productTableBody');
  tbody.innerHTML = '';
  pageProducts.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${p.images && p.images[0] ? p.images[0] : ''}" alt="" style="width:60px;height:40px;object-fit:cover;border-radius:4px;"></td>
      <td>${p.title}</td>
      <td>${p.price.toLocaleString()} đ</td>
      <td>${p.category?.name || ''}</td>
      <td>${p.description || ''}</td>
      <td>
        <button class="btn btn-sm btn-warning" title="Sửa" onclick="openProductModal(${p.id})">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-sm btn-danger ms-2" title="Xóa" onclick="deleteProduct(${p.id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  renderPagination(totalPages);
}

// Hiển thị phân trang dưới bảng
function renderPagination(totalPages) {
  let pag = document.getElementById('pagination');
  if (!pag) {
    pag = document.createElement('nav');
    pag.id = 'pagination';
    pag.className = 'd-flex justify-content-center mt-3';
    document.querySelector('.container').appendChild(pag);
  }
  if (totalPages <= 1) {
    pag.innerHTML = '';
    return;
  }
  let html = `<ul class="pagination pagination-sm mb-0">`;
  html += `<li class="page-item${currentPage === 1 ? ' disabled' : ''}">
    <button class="page-link" onclick="gotoPage(${currentPage - 1})" tabindex="-1">&laquo;</button>
  </li>`;
  // Hiển thị tối đa 5 trang, có ... nếu nhiều trang
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);
  if (currentPage <= 3) end = Math.min(5, totalPages);
  if (currentPage >= totalPages - 2) start = Math.max(1, totalPages - 4);
  if (start > 1) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
  for (let i = start; i <= end; i++) {
    html += `<li class="page-item${i === currentPage ? ' active' : ''}">
      <button class="page-link" onclick="gotoPage(${i})">${i}</button>
    </li>`;
  }
  if (end < totalPages) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
  html += `<li class="page-item${currentPage === totalPages ? ' disabled' : ''}">
    <button class="page-link" onclick="gotoPage(${currentPage + 1})">&raquo;</button>
  </li>`;
  html += `</ul>`;
  pag.innerHTML = html;
}

// Chuyển trang
function gotoPage(page) {
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderTable();
}

// Render option category cho select
function renderCategoryOptions(selectedId) {
  const select = document.getElementById('productCategory');
  if (!select) return;
  select.innerHTML = categories.map(c =>
    `<option value="${c.id}" ${selectedId == c.id ? 'selected' : ''}>${c.name}</option>`
  ).join('');
}

// Modal Thêm/Sửa sản phẩm
let productModal;
function openProductModal(id) {
  if (!productModal) productModal = new bootstrap.Modal(document.getElementById('productModal'));
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  document.getElementById('productModalTitle').textContent = id ? 'Sửa sản phẩm' : 'Thêm sản phẩm';
  renderCategoryOptions();
  if (id) {
    const p = products.find(x => x.id == id);
    if (p) {
      document.getElementById('productId').value = p.id;
      document.getElementById('productTitle').value = p.title;
      document.getElementById('productPrice').value = p.price;
      document.getElementById('productCategory').value = p.category?.id || '';
      document.getElementById('productImage').value = p.images && p.images[0] ? p.images[0] : '';
      document.getElementById('productDesc').value = p.description || '';
    }
  }
  productModal.show();
}

// Lưu sản phẩm (thêm/sửa)
function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const title = document.getElementById('productTitle').value.trim();
  const price = Number(document.getElementById('productPrice').value);
  const catId = document.getElementById('productCategory').value;
  const catObj = categories.find(c => c.id == catId);
  const image = document.getElementById('productImage').value.trim();
  const desc = document.getElementById('productDesc').value.trim();
  if (!title || !catObj) return;
  if (id) {
    // Sửa
    const idx = products.findIndex(x => x.id == id);
    if (idx > -1) {
      products[idx] = {
        ...products[idx],
        title, price, description: desc,
        category: { ...catObj },
        images: image ? [image] : []
      };
    }
  } else {
    // Thêm
    const newId = Date.now();
    products.push({
      id: newId,
      title, price, description: desc,
      category: { ...catObj },
      images: image ? [image] : [],
      creationAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  productModal.hide();
  renderTable();
}

// Xóa sản phẩm
function deleteProduct(id) {
  if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
    products = products.filter(p => p.id != id);
    renderTable();
  }
}

// Modal quản lý category
let categoryModal;
function openCategoryModal() {
  if (!categoryModal) categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));
  document.getElementById('categoryForm').reset();
  renderCategoryList();
  categoryModal.show();
}

// Lưu category mới
function saveCategory(e) {
  e.preventDefault();
  const name = document.getElementById('newCategoryName').value.trim();
  if (!name) return;
  // Kiểm tra trùng tên
  if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    alert('Category đã tồn tại!');
    return;
  }
  const newId = Date.now();
  categories.push({
    id: newId,
    name: name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    image: '',
    creationAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  renderCategoryOptions();
  renderCategoryList();
  document.getElementById('newCategoryName').value = '';
}

// Render danh sách category trong modal
function renderCategoryList() {
  const ul = document.getElementById('categoryList');
  if (!ul) return;
  ul.innerHTML = categories.map(c =>
    `<li class="list-group-item d-flex justify-content-between align-items-center">
      <span>${c.name}</span>
      <button class="btn btn-sm btn-danger" onclick="deleteCategory(${c.id})">Xóa</button>
    </li>`
  ).join('');
}

// Xóa category (chỉ khi không có sản phẩm nào dùng)
function deleteCategory(id) {
  if (products.some(p => p.category?.id == id)) {
    alert('Không thể xóa category đang được sử dụng!');
    return;
  }
  categories = categories.filter(c => c.id != id);
  renderCategoryOptions();
  renderCategoryList();
}

// Bổ sung: Khi thêm/sửa category, cập nhật lại select trong modal sản phẩm nếu đang mở
document.getElementById('categoryModal')?.addEventListener('hidden.bs.modal', renderCategoryOptions);
