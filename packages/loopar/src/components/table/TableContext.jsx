import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
  useMemo,
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
  const [searchData, setSearchData] = useState(
    initialMeta && initialMeta.q && typeof initialMeta.q === "object"
      ? initialMeta.q
      : {}
  );

  const [rows, setRows] = useState(props.rows || []);

  useEffect(() => {
    setRows(props.rows || []);
  }, [props.rows]);

  useEffect(() => {
    setMeta(initialMeta || {});
  }, [initialMeta]);

  const baseColumns = useCallback(() => {
    if (!meta) return [];
    
    const parseElements = (elements = []) => elements
      .map(el => [{ ...el }, ...parseElements(el.elements || [])]).flat()
      //.filter(el => !loopar.utils.trueValue(el.data.hidden) && loopar.utils.trueValue(el.data.in_list_view))

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

  const search = useCallback(async () => {
    await loopar.method(
      meta.__ENTITY__.name,
      docRef.action || meta.action,
      {},
      {
        body: {
          q: searchData,
          page: (meta.pagination && meta.pagination.page) || 1,
        },
        success: (res) => {
          setRows(res.rows || []);
        },
      }
    );
  }, [docRef.action, meta.__ENTITY__, meta.action, meta.pagination, searchData]);

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

  const deleteRow = (row) => {
    if (!row) return;
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

  const selectorCol = {
    data: {
      name: "selector",
      label: () => (
        <DropdownListGridActions/>
      ),
    },
    headProps: {
      className: "w-10 p-2",
      colSpan: 2
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

  const tableContextValue = {
    meta,
    rows,
    setRows,
    setMeta,
    addRow,
    selectedRows,
    setSelectedRows,
    searchData,
    setSearchData,
    docRef,
    rowsCount,
    selectedCount,
    selectorAllStatus,
    selectorCol,
    baseColumns: () => [
      ...baseColumns(),
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
