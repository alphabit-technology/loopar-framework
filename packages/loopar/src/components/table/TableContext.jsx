import {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
  useId,
  useRef
} from "react";

import elementManage from "@@tools/element-manage";
import loopar from "loopar";
import { DropdownListGridActions } from "./DropdownListGridActions";
import { Checkbox } from "@cn/components/ui/checkbox";

const TableContext = createContext();

export const useTable = () => useContext(TableContext);

export const TableProvider = ({
  initialMeta,
  docRef = {},
  hasSearchForm = false,
  viewType: _viewType,
  isEditable,
  onDeleteRow,
  children,
  ...props
}) => {
  const [meta, setMeta] = useState(initialMeta || {});
  const [selectedRows, setSelectedRows] = useState([]);
  const [pagination, setPagination] = useState(initialMeta.pagination || {});
  const lastSearch = useRef(null);
  
  const setPage = (page) => {
    pagination.page = page;
    setPagination(pagination);
    search(lastSearch.current, true);
  };

  const [rows, setRows] = useState(props.rows || []);
  const tableId = useId();
  const rowRefs = useRef({});

  useEffect(() => {
    setRows(props.rows || []);
  }, [props.rows]);

  useEffect(() => {
    setMeta(initialMeta || {});
  }, [initialMeta]);

  const baseColumns = useMemo(() => {
    if (!meta) return [];
    const parseElements = (elements = []) =>
      elements
        .map((el) => [{ ...el }, ...parseElements(el.elements || [])])
        .flat();
    const STRUCTURE = JSON.parse(meta.__ENTITY__?.doc_structure || "[]");
    return parseElements(STRUCTURE);
  }, [meta]);

  const selectRow = (row, checked) => {
    setSelectedRows((prevSelected) =>
      checked
        ? Array.from(new Set([...prevSelected, row.name]))
        : prevSelected.filter((r) => r !== row.name)
    );
  };

  const addRow = () => {
    const newRows =  [...rows]
    const maxId = loopar.utils.getArrayMax(newRows, "id") || 0;

    newRows.push({ id: maxId + 1, name: elementManage.uuid() });
    setRows(newRows);
  }

  const selectAllVisibleRows = (checked = true) => {
    const allNames = (rows || []).map((r) => r.name);
    setSelectedRows(checked ? allNames : []);
  };

  const search = (searchData, force=false) => {
    if (JSON.stringify(searchData) === JSON.stringify(lastSearch.current) && !force) return;
    lastSearch.current = searchData;

    loopar.method(
      meta.__ENTITY__.name,
      docRef.action || meta.action,
      {},
      {
        body: {
          q: searchData,
          page: (pagination && pagination.page) || 1,
        },
        success: (res) => {
          setMeta(res);
          setPagination(res.pagination || {});
          setRows(res.rows || []);
        },
      }
    );
  };

  const rowsCount = useMemo(() => rows.length, [rows]);
  const selectedCount = useMemo(() => selectedRows.length, [selectedRows]);

  const selectorAllStatus = useMemo(() => {
    if (rowsCount > 0 && selectedCount > 0 && selectedCount < rowsCount) {
      return "indeterminate";
    } else if (rowsCount > 0 && selectedCount === rowsCount) {
      return true;
    }
    return false;
  }, [rowsCount, selectedCount]);

  const deleteOnServer = async (row) => {
    loopar.dialog({
      type: "confirm",
      title: "Confirm",
      message: `Are you sure you want to delete ${row.name}?`,
      ok: async () => {
        await loopar.method(meta.__ENTITY__.name, "delete", {
          name: row.name,
        });
      },
    });
  }

  const deleteRow = (row, onServer=false) => {
    if (!row) return;
    if (onServer) return deleteOnServer(row);

    const rowName = row.name;
    const rowIndex = selectedRows.indexOf(rowName);
    if (rowIndex > -1) {
      setSelectedRows((prev) => prev.filter((r) => r !== rowName));
    }
    setRows((prev) => prev.filter((r) => r.name !== row.name));
    onDeleteRow && onDeleteRow();
  };

  const bulkRemove = () => {
    if (!selectedRows.length) return;
    setRows((prev) => prev.filter((r) => !selectedRows.includes(r.name)));
    setSelectedRows([]);
    onDeleteRow && onDeleteRow();
  };

  const selectorCol = (colSpan) => {
    return {
      data: {
        name: "selector",
        label: () => (
          <DropdownListGridActions/>
        ),
      },
      headProps: {
        className: "w-10 p-2",
        colSpan: colSpan || 2
      },
      cellProps: {
        className: "align-middle text-truncate w-10 p-4"
      },
      render: (row) => (
        <Checkbox
          onCheckedChange={(event) => {
            selectRow(row, event);
          }}
          checked={selectedRows.includes(row.name)}
        />
      ),
    }
  };

  const tableContextValue = {
    meta,
    rows,
    setRows,
    setMeta,
    addRow,
    selectedRows,
    setSelectedRows,
    docRef,
    rowsCount,
    selectedCount,
    selectorAllStatus,
    selectorCol,
    tableId,
    rowRefs,
    pagination,
    setPage,
    baseColumns: () => [
      ...baseColumns,
      {
        className: "align-middle text-right",
        rowsProps: {
          className: "align-middle text-right",
        },
        cellProps: {
          style: { width: 50 },
          className: "align-middle text-center",
        },
        isCustom: true,
        data: {
          name: "actions",
          label: "",
          value: (row) => {
            return (
              <Button
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  deleteRow(row);
                }}
              >
                <TrashIcon className="text-red-500" />
              </Button>
            );
          },
        },
      }
    ],
    selectRow,
    selectAllVisibleRows,
    search,
    deleteRow,
    bulkRemove,
  };

  return (
    <TableContext.Provider value={tableContextValue}>
      {children}
    </TableContext.Provider>
  );
};

export default TableContext;
