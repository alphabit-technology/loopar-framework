import {BaseTable} from "@base-table"
import BaseInput from "@base-input"
import MetaComponent from "@meta-component";
import pkg from "lodash";
const { cloneDeep } = pkg;

import {
  TableCell
} from "@/components/ui/table"
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

class FormTableClass extends BaseTable {
  hasFooterOptions = true;
  hasPagination = false;
  className = "feed";
  hasHeaderOptions = true;
  viewType = "List";
  __REFS__ = {};

  get mappedColumns() {
    return super.mappedColumns.map((col) => {
      if (col.data.name === "actions") {
        col.cellProps.className += " pt-0";
      }
      return col;
    });
  }

  onDeleteRow() {
    const meta = this.meta;
    this.props.onChange({target: {value: meta}});
  }

  getRenderColumns(columns, row) {
    return columns.map((column) => {
      const cellProps = column.cellProps ?? {};

      const handleInputChange = (row, column, value) => {
        row[column.data.name] = value;
        const meta = this.meta;
        meta.rows.find(r => r.name === row.name)[column.data.name] = value;
        this.props.onChange({target: {value: meta}});
      }

      if (fieldIsWritable(column)) {
        const cellName = row.name + "_" + column.data.name + "_input"
        
        return (
          <TableCell
            {...cellProps}
            key={column.name}
          >
            <MetaComponent
              elements={[
                {
                  element: column.element || DIV,
                  key: cellName,
                  dontHaveLabel: true,
                  dontHaveForm: true,
                  data: cloneDeep({
                    ...cloneDeep(column.data),
                    name: cellName,
                    value: row[column.data.name],
                    label: column.data.label,
                  }),
                  simpleInput: true,
                  onChange: e => {
                    clearTimeout(this.lastUpdate);
                    this.lastUpdate = setTimeout(() => {
                      handleInputChange(row, column,  e.target.value);
                    }, [SELECT, SWITCH, CHECKBOX].includes(column.element) ? 0: 300);
                  }
                },
              ]}
              parent={this}
            />
          </TableCell>
        )
      }else if (column.data.name === "actions") {
        return (
          <TableCell
            {...cellProps}
            key={column.name}
          >
            <Button
              type="button"
              variant="destructive"
              onClick={() => this.deleteRow(row)}
            >
              <Trash2Icon size={16} />
            </Button>
          </TableCell>
        );
      }
    })
  }

  getFooter(){
    const selectedRowsCount = this.selectedRows.length;
    
    return (
      <div className="flex flex-row gap-2">
        {selectedRowsCount > 0 && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => this.bulkRemove()}
          >
            <Trash2Icon className="mr-1" size={16} />
            Remove
          </Button>
        )}
        <Button
          type="button"
          variant="primary"
          onClick={() => this.addRow()}
        >
          <PlusIcon className="mr-1" size={16} />
          Add row
        </Button>
      </div>
    );
  }

  validate() {
    return Object.entries(this.__REFS__).reduce((acc, [key, field]) => {
      return acc.concat(
        field?.validate()
      );
    }, []);
  }

  /*validate() {
    return Object.entries(this.rowsRef).reduce((acc, [key, row]) => {
      return acc.concat(
        Object.values(row)
          .map((el) => {
            return el?.validate();
          })
          .filter((el) => !el?.valid)
          .map((el) => {
            return {
              message: "Row " + key + " " + el.message,
              valid: el.valid,
            };
          })
      );
    }, []);
  }*/
}

export default class FormTable extends BaseInput {
  render(){
    const handleChange = (e) => {
      //console.log(["Form Table Change", e.target.value])
      this.value(e.target.value);
    }
    return super.renderInput(field => {
      //console.log(["Form Table", field.value])
      //const meta = JSON.parse(JSON.stringify(this.props));
      //meta.rows = field.value || [];


      return (
        <FormTableClass
          //meta={JSON.parse(JSON.stringify(this.props))}
          meta={field.value}
          //meta={meta}
          onChange={handleChange}
          ref={formRefTable => {this.formRefTable = formRefTable}}
        />
      )
    });
  }

  validate() {
    return this.formRefTable?.validate();
  }

  /*validate() {
    return Object.entries(this.rowsRef).reduce((acc, [key, row]) => {
      return acc.concat(
        Object.values(row)
          .map((el) => {
            return el?.validate();
          })
          .filter((el) => !el?.valid)
          .map((el) => {
            return {
              message: "Row " + key + " " + el.message,
              valid: el.valid,
            };
          })
      );
    }, []);
  }*/

  get metaFields() {
    return [
      {
        group: "form",
        elements: {
          options: {
            element: TEXTAREA,
          },
        },
      },
    ];
  }
}